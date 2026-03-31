import { Component, OnInit, OnDestroy, HostListener, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../core/config/emailjs.config';

@Component({
    selector: 'app-engineer',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './engineer.component.html',
    styleUrls: ['./engineer.component.scss']
})
export class EngineerComponent implements OnInit, OnDestroy {
    // --- Signals ---
    isLightMode = computed(() => this.themeService.engineerTheme() === 'light');
    navOpen = signal(false);
    activeSection = signal('hero');
    formStatus = signal<'idle' | 'sending' | 'success' | 'error'>('idle');

    // Derived: nav is scrolled when not on hero
    isScrolled = computed(() => this.activeSection() !== 'hero');

    contactForm!: FormGroup;

    private observer!: IntersectionObserver;

    skills = {
        frontend: [
            { name: 'Angular', tip: '5+ yrs — daily driver at LeanTaaS' },
            { name: 'TypeScript', tip: 'Strict mode, generics, advanced patterns' },
            { name: 'NgRx / Signals', tip: 'Migrated BehaviorSubject → Signals at LeanTaaS' },
            { name: 'RxJS', tip: 'Complex async pipelines, custom operators' },
            { name: 'HTML / CSS / SCSS', tip: 'Responsive design, BEM, CSS Grid, Flexbox' },
            { name: 'Chart.js', tip: 'Data-viz dashboards at LeanTaaS' },
            { name: 'Vanilla JS', tip: 'DOM manipulation, performance-critical paths' },
        ],
        backend: [
            { name: 'Python', tip: 'Django services, scripting, data processing' },
            { name: 'Django', tip: 'REST APIs, ORM, middleware at LeanTaaS' },
            { name: 'REST APIs', tip: 'Design, versioning, pagination, auth' },
            { name: 'Play Framework', tip: 'Java/Scala — legacy modernization' },
        ],
        tools: [
            { name: 'Git', tip: 'Rebasing, bisect, CI branch strategies' },
            { name: 'Jenkins', tip: 'CI/CD pipelines, automated deployments' },
            { name: 'Jira', tip: 'Sprint planning, backlog grooming' },
            { name: 'Firebase', tip: 'Hosting, Firestore, Cloud Functions' },
            { name: 'Docker', tip: 'Containerised dev & deploy workflows' },
        ],
        ai: [
            { name: 'Claude / GPT-4', tip: 'Prompt engineering, tool-use agents' },
            { name: 'Cursor AI', tip: 'AI-assisted coding, codebase Q&A' },
            { name: 'GitHub Copilot', tip: 'Inline completions, test generation' },
            { name: 'Agentic Workflows', tip: 'Multi-step tool-use, self-correcting loops' },
        ]
    };

    experience = [
        {
            company: 'LeanTaaS', role: 'Senior Software Engineer',
            period: 'Jun 2022 – Present', duration: '3 yrs 9 mos',
            location: 'San Francisco Bay Area', current: true,
            highlights: [
                'End-to-End ownership: requirements to production — architecture, implementation, and optimization.',
                'Modernized core platform: re-implemented legacy Angular/Play modules to Python Django + Vanilla JS.',
                'Migrated state management to NgRx → Angular Signals, eliminating data inconsistencies in high-volume scheduling views.',
                'Delivered prediction-based staffing variance calculations, improving hospital staff scheduling accuracy.',
                'Architected scalable staffing calculators and led key contributions to the IPF platform transition.',
                'Partnered with Data Science on Auto-Assign: built all application logic (FE + BE) around an ML model for automatic staff scheduling.',
                'Performance wins: reduced API calls, added virtual scrolling, optimized async pipes and trackBy functions, fixed memory leaks in tooltip directives.',
            ]
        },
        {
            company: 'LeanTaaS', role: 'Software Engineer',
            period: 'Oct 2019 – Jun 2022', duration: '2 yrs 9 mos',
            location: 'San Francisco Bay Area', current: false,
            highlights: [
                'Built flagship staffing module: drove 4 new customer acquisitions in its first month.',
                'Led refactors reducing code duplication by 32% and removing 3 major external dependencies.',
                'Built a 4D Angular + Chart.js COVID predictor — contributed to a 40% boost in customer retention during peak attrition.',
                'Developed configuration modules reducing hospital onboarding from 3 months to a few weeks.',
                'Implemented role-based access with 8-level permission checks in sensitive hospital environments.',
                'Built a data validation suite detecting 6,000+ discrepancies through consistency testing.',
            ]
        },
        {
            company: 'Micron Technology', role: 'Software & Systems Engineering Intern — 3DXP R&D',
            period: 'Jun 2018 – Aug 2018', duration: '3 mos',
            location: 'San Francisco Bay Area', current: false,
            highlights: [
                'Worked on groundbreaking 3D X-point memory technology.',
                'Profiled and optimized the 3DXP 2-tier memory management algorithm.',
                'Developed Python scripts to benchmark performance.',
                'Reduced page faults in server applications by 9% through behavioral data analysis.',
            ]
        },
        {
            company: 'Compass Group', role: 'Student Lead / Trainer',
            period: 'Jun 2017 – Jun 2018', duration: '1 yr 1 mo',
            location: 'San Jose State University', current: false,
            highlights: [
                'Led 50+ employees at Spartan Eats, SJSU.',
                'Trained graduate and undergraduate students in daily operations.',
            ]
        },
        {
            company: 'IIT Bombay E-Cell', role: 'Event Coordinator',
            period: 'Jul 2014 – Feb 2016', duration: '1 yr 8 mos',
            location: 'Pune, India', current: false,
            highlights: [
                'Organized entrepreneurial events for IIT Bombay\'s E-Cell.',
                'Coordinated sponsor campaigns for E-Conclave 2015 & 2016.',
            ]
        }
    ];

    education = [
        { school: 'San José State University', degree: 'M.S. Computer Software Engineering', concentration: 'Software Systems Engineering (SSE)', period: '2017 – 2019', logo: '🎓' },
        { school: 'Savitribai Phule Pune University', degree: 'B.E. Computer Science & Engineering', concentration: '', period: '2012 – 2016', logo: '🎓' }
    ];

    constructor(
        private router: Router,
        public themeService: ThemeService,
        private fb: FormBuilder,
        private el: ElementRef
    ) { }

    ngOnInit(): void {
        this.themeService.loadSavedThemes();
        this.contactForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            message: ['', [Validators.required, Validators.minLength(10)]]
        });
        emailjs.init(EMAILJS_CONFIG.publicKey);
        setTimeout(() => this.setupScrollReveal(), 100);
    }

    ngOnDestroy(): void {
        if (this.observer) this.observer.disconnect();
    }

    toggleTheme() { this.themeService.toggleEngineerTheme(); }
    switchWorld() { this.router.navigate(['/photography']); }

    scrollTo(id: string) {
        this.navOpen.set(false);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    @HostListener('window:scroll')
    onScroll() { this.onContainerScroll(); }

    onContainerScroll() {
        const scrollY = window.scrollY;

        // Drive parallax — set CSS custom property on the host element
        this.el.nativeElement.style.setProperty('--scroll-y', scrollY.toString());

        // Section tracking for nav dots / active link
        const sections = ['hero', 'about', 'skills', 'experience', 'projects', 'contact'];
        for (const id of sections) {
            const el = document.getElementById(id);
            if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= 150 && rect.bottom >= 150) { this.activeSection.set(id); break; }
            }
        }
    }

    setupScrollReveal() {
        const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
        this.observer = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
            { threshold: 0.12 }
        );
        elements.forEach(el => this.observer.observe(el));
    }

    async sendEmail() {
        if (this.contactForm.invalid) { this.contactForm.markAllAsTouched(); return; }
        this.formStatus.set('sending');
        try {
            await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
                from_name: this.contactForm.value.name,
                from_email: this.contactForm.value.email,
                message: this.contactForm.value.message,
                to_email: 'rajeevvpatil899@gmail.com'
            });
            this.formStatus.set('success');
            this.contactForm.reset();
        } catch {
            this.formStatus.set('error');
        }
    }

    trackByIndex(i: number) { return i; }
    trackByName(_: number, s: { name: string }) { return s.name; }
}
