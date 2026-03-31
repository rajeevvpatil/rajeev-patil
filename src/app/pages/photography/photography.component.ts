import { Component, OnInit, OnDestroy, HostListener, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import { PhotoStorageService, StoredPhoto, Photo } from '../../core/services/photo-storage.service';
import { EmailService } from '../../core/services/email.service';

const SCROLL_REVEAL_DELAY_MS = 100;
const SCROLL_REVEAL_THRESHOLD = 0.1;

@Component({
    selector: 'app-photography',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './photography.component.html',
    styleUrls: ['./photography.component.scss']
})
export class PhotographyComponent implements OnInit, OnDestroy {
    // --- Signals ---
    isDarkMode = computed(() => this.themeService.photographyTheme() === 'dark');
    navOpen = signal(false);
    activeSection = signal('hero');
    activeGenre = signal('landscape');
    lightboxOpen = signal(false);
    lightboxPhoto = signal<Photo | null>(null);
    lightboxIndex = signal(0);
    formStatus = signal<'idle' | 'sending' | 'success' | 'error'>('idle');

    isScrolled = computed(() => this.activeSection() !== 'hero');

    contactForm!: FormGroup;
    private observer!: IntersectionObserver;

    genres = ['landscape', 'astro', 'street', 'portraits'];
    uploadedPhotosByGenre: { [genre: string]: Photo[] } = {};

    get filteredPhotos(): Photo[] {
        return this.uploadedPhotosByGenre[this.activeGenre()] || [];
    }
    get hasPhotos(): boolean { return this.filteredPhotos.length > 0; }

    constructor(
        private router: Router,
        public themeService: ThemeService,
        private fb: FormBuilder,
        private photoStorage: PhotoStorageService,
        private el: ElementRef,
        private emailService: EmailService
    ) { }

    ngOnInit(): void {
        this.themeService.loadSavedThemes();
        this.contactForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            subject: [''],
            message: ['', [Validators.required, Validators.minLength(10)]]
        });
        this.loadUploadedPhotos();
        setTimeout(() => this.setupScrollReveal(), SCROLL_REVEAL_DELAY_MS);
    }

    ngOnDestroy(): void {
        if (this.observer) this.observer.disconnect();
    }

    async loadUploadedPhotos() {
        try {
            for (const genre of this.genres) {
                const stored: StoredPhoto[] = await this.photoStorage.getPhotosByGenre(genre);
                this.uploadedPhotosByGenre[genre] = stored
                    .sort((a, b) => a.uploadedAt - b.uploadedAt)
                    .map(s => ({ id: s.id, src: s.dataUrl, alt: s.alt, genre: s.genre, span: s.span, isUploaded: true }));
            }
        } catch {
            // IndexedDB unavailable — gallery will remain empty
        }
    }

    toggleTheme() { this.themeService.togglePhotographyTheme(); }
    switchWorld() { this.router.navigate(['/engineer']); }

    scrollTo(id: string) {
        this.navOpen.set(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setGenre(genre: string) { this.activeGenre.set(genre); }

    openLightbox(photo: Photo) {
        const idx = this.filteredPhotos.indexOf(photo);
        this.lightboxIndex.set(idx >= 0 ? idx : 0);
        this.lightboxPhoto.set(photo);
        this.lightboxOpen.set(true);
        document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
        this.lightboxOpen.set(false);
        this.lightboxPhoto.set(null);
        document.body.style.overflow = '';
    }

    nextPhoto() {
        const photos = this.filteredPhotos;
        if (photos.length === 0) return;
        const next = (this.lightboxIndex() + 1) % photos.length;
        this.lightboxIndex.set(next);
        this.lightboxPhoto.set(photos[next]);
    }

    prevPhoto() {
        const photos = this.filteredPhotos;
        if (photos.length === 0) return;
        const prev = (this.lightboxIndex() - 1 + photos.length) % photos.length;
        this.lightboxIndex.set(prev);
        this.lightboxPhoto.set(photos[prev]);
    }

    @HostListener('document:keydown.escape')
    onEscKey() { if (this.lightboxOpen()) this.closeLightbox(); }

    @HostListener('document:keydown.arrowRight')
    onRightKey() { if (this.lightboxOpen()) this.nextPhoto(); }

    @HostListener('document:keydown.arrowLeft')
    onLeftKey() { if (this.lightboxOpen()) this.prevPhoto(); }

    onContainerScroll() {
        const scrollY = window.scrollY;

        // Drive parallax CSS custom property
        this.el.nativeElement.style.setProperty('--scroll-y', scrollY.toString());

        // Section tracking
        const sections = ['hero', 'about', 'gallery', 'contact'];
        for (const id of sections) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= 150 && rect.bottom >= 150) { this.activeSection.set(id); break; }
            }
        }
    }

    @HostListener('window:scroll')
    onScroll() { this.onContainerScroll(); }

    setupScrollReveal() {
        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        this.observer = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
            { threshold: SCROLL_REVEAL_THRESHOLD }
        );
        elements.forEach(el => this.observer.observe(el));
    }

    handleImgError(event: Event) {
        const img = event.target as HTMLImageElement;
        if (!img.src || img.src.startsWith('data:')) return;
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) {
            parent.innerHTML = `<div class="photo-item-placeholder"><i class="fas fa-image"></i><span>${img.alt}</span></div>`;
        }
    }

    async sendEmail() {
        if (this.contactForm.invalid) { this.contactForm.markAllAsTouched(); return; }
        this.formStatus.set('sending');
        try {
            await this.emailService.send({
                from_name: this.contactForm.value.name,
                from_email: this.contactForm.value.email,
                subject: this.contactForm.value.subject || 'Photography Inquiry',
                message: this.contactForm.value.message
            });
            this.formStatus.set('success');
            this.contactForm.reset();
        } catch {
            this.formStatus.set('error');
        }
    }

    trackByIndex(i: number) { return i; }
    trackByPhotoId(_: number, p: Photo) { return p.id; }
}
