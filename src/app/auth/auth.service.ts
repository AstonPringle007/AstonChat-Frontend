import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { map, Observable, tap } from "rxjs";
import { STATIC } from "./static";
 import * as CryptoJS from 'crypto-js';
@Injectable({ providedIn: 'root' })
export class AuthService {
  encryptedData: any;
  decryptedData: any;
  userDecryptedData: any;
  jwtDecryptedData: any;
  constructor(private http: HttpClient, private router: Router) { }
 
login(username: string, password: string, productId: string): Observable<boolean> {
  return this.http.post(`api/auth/login`, { username, password, productId }).pipe(
    map((res: any) => {
      const success = this.resEncryptedUsingAlg(res);
      if (!success) {
        throw new Error('Decryption failed');
      }
      return true;
    })
  );
}


  logout() {
    localStorage.removeItem('jwt'); // or sessionStorage.removeItem(...)
    localStorage.removeItem('userData');
    this.router.navigate(['/login']);
  }
 
 
  getUsersByProduct(productId: string): Observable<any[]> {
    return this.http.get<any[]>(`api/users/by-product/${productId}`);
  }
 
  getUsersList(pageIndex?: number, pageSize?: number, search?: string): Observable<any[]> {
    return this.http.get<any[]>(`api/users/user-list?pageIndex=${pageIndex}&pageSize=${pageSize}&search=${search}`);
  }
 
  getMessagesWithUser(userId: string, productId: string, senderId: string, userProductId: string): Observable<any[]> {
    return this.http.get<any[]>(`api/messages/conversation/${productId}/${userId}/${senderId}/${userProductId}`);
  }
 
  getToken() {
    return localStorage.getItem('jwt');
  }
 
  getUserData(): any {
  const userDataString = localStorage.getItem('userData') || '{}';
  const userData = JSON.parse(userDataString);
  console.log('userData: ', userData)
  return userData;
}

  getProfileImageUrl() {
    let profileURL;
    if(this.getUserData().profileURL) {
     profileURL = `${STATIC.blobUrl}` + this.getUserData().profileURL;
    }
    return profileURL;
  }
 
  getUsersProfileImage(url: any) {
    let profileURL;
    if(url) {
      profileURL = `${STATIC.blobUrl}` + url;
    }
    return profileURL;
  }
 
  getUserID() {
    const userId = this.getUserData().userId;
    return userId;
  }

  getProfileAlt() {
    const profileAlt = this.getUserData().profileAlt;
    return profileAlt;
  }
 
  getUserUserName() {
    const userName = `${this.getUserData().firstName} ${this.getUserData().lastName}`;
    return userName;
  }
 
  getUserProductID() {
    const productId = this.getUserData().productId;
    return productId;
  }
 
  get getUserEmailID() {
    const emailId = this.getUserData().email;
    return emailId;
  }
 
  getProductDropdown(data: any) {
    return this.http.post<any[]>(`api/products/drop-down`, data);
  }
 
  get isLoggedIn(): boolean {
    const token = localStorage.getItem('jwt')
    return !!token;
  }

getDefaultData(res: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const res1: any = window.atob(res);
      const data = JSON.parse(res1);

      const success = this.resEncryptedUsingAlg1(data);

      if (success && this.userDecryptedData && this.jwtDecryptedData) {
        localStorage.setItem('jwt', this.jwtDecryptedData);
        localStorage.setItem('userData', JSON.stringify(this.userDecryptedData));
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.error('Error in getDefaultData:', error);
      resolve(false);
    }
  });
}



resEncryptedUsingAlg(data: any): boolean {
  try {
    this.encryptedData = data;
    const base64Key = 'UmlFbkt0T2VDbEhpQXpDcA==';
    const key = CryptoJS.enc.Base64.parse(base64Key);

    // For user
    const userEncryptedText = data.data.data1 ? data.data.data1 : data.data1;
    const uCiphertext = CryptoJS.enc.Base64.parse(userEncryptedText);
    const uParams = CryptoJS.lib.CipherParams.create({ ciphertext: uCiphertext });
    const uBytes = CryptoJS.AES.decrypt(uParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const uText = uBytes.toString(CryptoJS.enc.Utf8);
    this.userDecryptedData = JSON.parse(uText);

    // For JWT
    const jwtEncryptedText = data.data.data2 ? data.data.data2 : data.data2;
    const jCiphertext = CryptoJS.enc.Base64.parse(jwtEncryptedText);
    const jParams = CryptoJS.lib.CipherParams.create({ ciphertext: jCiphertext });
    const jBytes = CryptoJS.AES.decrypt(jParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const jText = jBytes.toString(CryptoJS.enc.Utf8);
    this.jwtDecryptedData = JSON.parse(jText);

    // Store in localStorage
    localStorage.setItem('jwt', this.jwtDecryptedData);
    localStorage.setItem('userData', JSON.stringify(this.userDecryptedData.data));

    return true;
  } catch (err) {
    console.error('❌ Decryption failed:', err);
    this.userDecryptedData = null;
    this.jwtDecryptedData = null;
    return false;
  }
}
resEncryptedUsingAlg1(data: any): boolean {
  try {
    this.encryptedData = data;
    const base64Key = 'UmlFbkt0T2VDbEhpQXpDcA==';
    const key = CryptoJS.enc.Base64.parse(base64Key);

    // For user
    const userEncryptedText = data.data1 ? data.data1 : data.data1;
    const uCiphertext = CryptoJS.enc.Base64.parse(userEncryptedText);
    const uParams = CryptoJS.lib.CipherParams.create({ ciphertext: uCiphertext });
    const uBytes = CryptoJS.AES.decrypt(uParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const uText = uBytes.toString(CryptoJS.enc.Utf8);
    this.userDecryptedData = JSON.parse(uText);

    // For JWT
    const jwtEncryptedText = data.data2 ? data.data2 : data.data2;
    const jCiphertext = CryptoJS.enc.Base64.parse(jwtEncryptedText);
    const jParams = CryptoJS.lib.CipherParams.create({ ciphertext: jCiphertext });
    const jBytes = CryptoJS.AES.decrypt(jParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
    });
    const jText = jBytes.toString(CryptoJS.enc.Utf8);
    this.jwtDecryptedData = JSON.parse(jText);

    // Store in localStorage
    localStorage.setItem('jwt', this.jwtDecryptedData);
    localStorage.setItem('userData', JSON.stringify(this.userDecryptedData));

    return true;
  } catch (err) {
    console.error('❌ Decryption failed:', err);
    this.userDecryptedData = null;
    this.jwtDecryptedData = null;
    return false;
  }
}


 
}