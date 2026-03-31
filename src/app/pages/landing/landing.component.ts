import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
    hoveredSide = signal<'engineer' | 'photography' | null>(null);
    animateIn = signal(false);

    constructor(private router: Router) { }

    ngOnInit() {
        setTimeout(() => this.animateIn.set(true), 80);
    }

    navigate(side: 'engineer' | 'photography') {
        this.router.navigate([`/${side}`]);
    }
}
