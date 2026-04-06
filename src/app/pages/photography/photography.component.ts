import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, signal, computed } from '@angular/core';
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

    @ViewChild('lightboxClose') lightboxCloseBtn!: ElementRef<HTMLButtonElement>;

    contactForm!: FormGroup;
    private observer!: IntersectionObserver;
    private lastFocusedElement: HTMLElement | null = null;
    private rafId: number | null = null;
    private touchStartX = 0;

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
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
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
        this.lastFocusedElement = document.activeElement as HTMLElement;
        const idx = this.filteredPhotos.indexOf(photo);
        this.lightboxIndex.set(idx >= 0 ? idx : 0);
        this.lightboxPhoto.set(photo);
        this.lightboxOpen.set(true);
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.lightboxCloseBtn?.nativeElement.focus(), 0);
    }

    closeLightbox() {
        this.lightboxOpen.set(false);
        this.lightboxPhoto.set(null);
        document.body.style.overflow = '';
        setTimeout(() => this.lastFocusedElement?.focus(), 0);
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

    @HostListener('document:keydown', ['$event'])
    onKeydown(e: KeyboardEvent) {
        if (!this.lightboxOpen() || e.key !== 'Tab') return;
        const lightbox = this.el.nativeElement.querySelector('.lightbox');
        const focusable = Array.from(
            lightbox.querySelectorAll('button:not([disabled])')
        ) as HTMLElement[];
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }

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
    onScroll() {
        if (this.rafId !== null) return;
        this.rafId = requestAnimationFrame(() => {
            this.onContainerScroll();
            this.rafId = null;
        });
    }

    @HostListener('document:touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        if (!this.lightboxOpen()) return;
        this.touchStartX = e.changedTouches[0].clientX;
    }

    @HostListener('document:touchend', ['$event'])
    onTouchEnd(e: TouchEvent) {
        if (!this.lightboxOpen()) return;
        const diff = this.touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) < 50) return;
        if (diff > 0) this.nextPhoto(); else this.prevPhoto();
    }

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
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            const firstInvalid = this.el.nativeElement.querySelector('input.ng-invalid, textarea.ng-invalid');
            if (firstInvalid) (firstInvalid as HTMLElement).focus();
            return;
        }
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
            setTimeout(() => this.formStatus.set('idle'), 5000);
        } catch {
            this.formStatus.set('error');
            setTimeout(() => this.formStatus.set('idle'), 5000);
        }
    }

    trackByIndex(i: number) { return i; }
    trackByPhotoId(_: number, p: Photo) { return p.id; }
}
