import { Component, ElementRef, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
// @ts-ignore
import BIRDS from 'vanta/dist/vanta.birds.min';
import * as THREE from 'three';

@Component({
    selector: 'app-background-effect',
    standalone: true,
    template: `<div #vantaRef class="vanta-bg"></div>`,
    styleUrls: ['./background-effect.component.css']
})
export class BackgroundEffectComponent implements AfterViewInit, OnDestroy {
    @ViewChild('vantaRef') vantaRef!: ElementRef;
    private vantaEffect: any;

    ngAfterViewInit(): void {
        this.vantaEffect = BIRDS({
            el: this.vantaRef.nativeElement,
            THREE: THREE, // Pass THREE explicitly
            quantity: 3.00,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x3b82f6, // Primary blue
            backgroundColor: '#000000' // Dark background
        });
    }

    ngOnDestroy(): void {
        if (this.vantaEffect) {
            this.vantaEffect.destroy();
        }
    }
}
