import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    protected authService: AuthService,
    protected router: Router
  ) {}

canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
  const url = state.url;

  if (url.includes('chatlogin/')) {
    const tokenStartIndex = url.indexOf('chatlogin/') + 'chatlogin/'.length;
    const encryptedToken = url.substring(tokenStartIndex);

    if (encryptedToken) {
      return this.authService.getDefaultData(encryptedToken).then(success => {
        if (success) {
          this.router.navigate(['/chat']);
          return false; // Don't proceed to /chatlogin, we're redirecting manually
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      });
    }
  }

  const jwt = localStorage.getItem('jwt');
  if (jwt) return Promise.resolve(true);

  this.router.navigate(['/login']);
  return Promise.resolve(false);
}

}
