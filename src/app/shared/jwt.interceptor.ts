import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from 'rxjs';
import { STATIC } from "../auth/static";
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${jwt}` },
        url: `${STATIC.endpoint}${req.url}`
      });
    } else {
      req = req.clone({
        url: `${STATIC.endpoint}${req.url}`
      });
    }
    return next.handle(req);
  }
}
