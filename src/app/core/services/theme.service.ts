import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    /** Writable signals — read with engineerTheme(), write via toggle methods */
    readonly engineerTheme = signal<'dark' | 'light'>('dark');
    readonly photographyTheme = signal<'light' | 'dark'>('light');

    toggleEngineerTheme() {
        const next = this.engineerTheme() === 'dark' ? 'light' : 'dark';
        this.engineerTheme.set(next);
        localStorage.setItem('engineer-theme', next);
    }

    togglePhotographyTheme() {
        const next = this.photographyTheme() === 'light' ? 'dark' : 'light';
        this.photographyTheme.set(next);
        localStorage.setItem('photography-theme', next);
    }

    loadSavedThemes() {
        const eng = localStorage.getItem('engineer-theme') as 'dark' | 'light';
        const photo = localStorage.getItem('photography-theme') as 'light' | 'dark';
        if (eng) this.engineerTheme.set(eng);
        if (photo) this.photographyTheme.set(photo);
    }
}
