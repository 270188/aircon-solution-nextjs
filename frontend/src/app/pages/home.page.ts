import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AboutComponent } from '../sections/about.component';
import { BookingComponent } from '../sections/booking.component';
import { BrandsStatsComponent } from '../sections/brands-stats.component';
import { ContactComponent } from '../sections/contact.component';
import { FaqComponent } from '../sections/faq.component';
import { GalleryComponent } from '../sections/gallery.component';
import { HeroComponent } from '../sections/hero.component';
import { ProcessComponent } from '../sections/process.component';
import { ServicesComponent } from '../sections/services.component';
import { TestimonialsComponent } from '../sections/testimonials.component';

@Component({
  selector: 'app-home-page',
  imports: [
    HeroComponent,
    BrandsStatsComponent,
    ServicesComponent,
    ProcessComponent,
    GalleryComponent,
    AboutComponent,
    TestimonialsComponent,
    BookingComponent,
    FaqComponent,
    ContactComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-brands-stats />
    <app-services />
    <app-process />
    <app-gallery />
    <app-about />
    <app-testimonials />
    <app-booking />
    <app-faq />
    <app-contact />
  `,
})
export class HomePage {}
