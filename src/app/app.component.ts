import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'iz-chat-ui';
  toggleClass='fullscreen'; // fullscreen
  elem: any; 
  deferredPrompt: any;
  showInstallButton = false;

  constructor( @Inject(DOCUMENT) private document: any,private faLibrary: FaIconLibrary) {
       this.faLibrary.addIcons(faChevronLeft, faChevronRight);
    try {
      this.elem = document.documentElement;// fullscreen
    } catch (error) {
      
    }
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();
    this.deferredPrompt = event;
    this.showInstallButton = true; // Show your install icon
  }

  async installApp() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }

    this.deferredPrompt = null;
    this.showInstallButton = false;
  }

  fullScreenToggle() { // fullscreen
    if(this.toggleClass !== 'fullscreen') {
      return this.exitFullScreen();
    }
    if(this.elem.requestFullscreen) {
      this.elem.requestFullscreen();
    } else if(this.elem.mozRequestFullscreen) {
      // firefox
      this.elem.mozRequestFullscreen();
    } else if(this.elem.webkitRequestFullscreen) {
      // chrome, safari, opera
      this.elem.webkitRequestFullscreen();
    } else if(this.elem.msRequestFullscreen) {
      // IE Edge
      this.elem.msRequestFullscreen();
    }
  }
  exitFullScreen() { // fullscreen
    if(this.document.exitFullscreen) {
      this.document.exitFullscreen();
    } else if(this.document.mozCancelFullscreen) {
      // firefox
      this.document.mozCancelFullscreen();
    } else if(this.document.webkitExitFullscreen) {
      // chrome, safari, opera
      this.document.webkitExitFullscreen();
    } else if(this.document.msExitFullscreen) {
      // IE Edge
      this.document.msExitFullscreen();
    }
  }
@HostListener('document:fullscreenchange', ['$event'])
@HostListener('document:webkitfullscreenchange', ['$event'])
@HostListener('document:mozfullscreenchange', ['$event'])
@HostListener('document:MSFullscreenChange', ['$event'])
checkFullScreen(event: Event) {
  if (this.toggleClass === 'fullscreen') {
    this.toggleClass = 'fullscreen_exit';
  } else {
    this.toggleClass = 'fullscreen';
  }
}
}
