import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhotoStorageService, StoredPhoto } from '../../core/services/photo-storage.service';
import { environment } from '../../../environments/environment';

const ADMIN_PIN = environment.adminPin;

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
    isAuthenticated = false;
    pinInput = '';
    pinError = false;

    genres = ['landscape', 'astro', 'street', 'portraits'];
    selectedGenre = 'landscape';

    photosByGenre: { [genre: string]: StoredPhoto[] } = {
        landscape: [],
        astro: [],
        street: [],
        portraits: []
    };

    isDraggingOver = false;
    uploadProgress: { [id: string]: number } = {};
    uploading = false;

    get currentPhotos(): StoredPhoto[] {
        return this.photosByGenre[this.selectedGenre] || [];
    }

    get uploadProgressKeys(): string[] {
        return Object.keys(this.uploadProgress);
    }

    get totalCount(): number {
        return Object.values(this.photosByGenre).reduce((sum, arr) => sum + arr.length, 0);
    }

    constructor(
        private router: Router,
        private photoStorage: PhotoStorageService
    ) { }

    ngOnInit(): void {
        const saved = sessionStorage.getItem('admin-auth');
        if (saved === 'true') {
            this.isAuthenticated = true;
            this.loadAllPhotos();
        }
    }

    checkPin() {
        if (this.pinInput === ADMIN_PIN) {
            this.isAuthenticated = true;
            this.pinError = false;
            sessionStorage.setItem('admin-auth', 'true');
            this.loadAllPhotos();
        } else {
            this.pinError = true;
            this.pinInput = '';
        }
    }

    @HostListener('document:keydown.enter')
    onEnter() {
        if (!this.isAuthenticated && this.pinInput.length > 0) {
            this.checkPin();
        }
    }

    async loadAllPhotos() {
        for (const genre of this.genres) {
            const photos = await this.photoStorage.getPhotosByGenre(genre);
            this.photosByGenre[genre] = photos.sort((a, b) => b.uploadedAt - a.uploadedAt);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDraggingOver = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        this.isDraggingOver = false;
    }

    async onDrop(event: DragEvent) {
        event.preventDefault();
        this.isDraggingOver = false;
        const files = Array.from(event.dataTransfer?.files || [])
            .filter(f => f.type.startsWith('image/'));
        if (files.length > 0) await this.processFiles(files);
    }

    async onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) await this.processFiles(files);
        input.value = '';
    }

    async processFiles(files: File[]) {
        this.uploading = true;

        for (const file of files) {
            const id = this.photoStorage.generateId();
            this.uploadProgress[id] = 0;

            try {
                const dataUrl = await this.photoStorage.fileToDataUrl(file);
                this.uploadProgress[id] = 60;

                const photo: StoredPhoto = {
                    id,
                    genre: this.selectedGenre,
                    fileName: file.name,
                    dataUrl,
                    alt: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                    uploadedAt: Date.now()
                };

                await this.photoStorage.savePhoto(photo);
                this.uploadProgress[id] = 100;

                this.photosByGenre[this.selectedGenre] = [
                    photo,
                    ...this.photosByGenre[this.selectedGenre]
                ];

                setTimeout(() => delete this.uploadProgress[id], 1500);
            } catch {
                delete this.uploadProgress[id];
            }
        }
        this.uploading = false;
    }

    async deletePhoto(photo: StoredPhoto) {
        await this.photoStorage.deletePhoto(photo.id);
        this.photosByGenre[photo.genre] = this.photosByGenre[photo.genre].filter(p => p.id !== photo.id);
    }

    async updateSpan(photo: StoredPhoto, span: string) {
        photo.span = span === 'normal' ? undefined : span as 'wide' | 'tall';
        await this.photoStorage.savePhoto(photo);
    }

    logout() {
        sessionStorage.removeItem('admin-auth');
        this.router.navigate(['/photography']);
    }

    goToGallery() {
        this.router.navigate(['/photography']);
    }
}
