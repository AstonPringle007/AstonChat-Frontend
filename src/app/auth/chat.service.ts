import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, first, map, Observable } from 'rxjs';
import { Message } from '../pages/model/message.model';
import { STATIC } from './static';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
declare var SockJS: any;




@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {

  // Subjects for messages and typing
  private messagesSubject = new BehaviorSubject<any>(null);
  private typingSubject = new BehaviorSubject<any>(null);

   // Public observables
  public messages$: Observable<any> = this.messagesSubject.asObservable();
  public typing$: Observable<any> = this.typingSubject.asObservable();
 
  private stompClient!: Client;  // ✅ fixed here

  private socketUrl = `${STATIC.endpoint}ws`;
  constructor(private http: HttpClient){}
  
 connect(userId: string, token: any) {
    const socket = new SockJS(this.socketUrl+`?token=${token}`);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      debug: (str: any) => console.log(str),
      reconnectDelay: 5000
    });

    this.stompClient.onConnect = () => {
    //   this.stompClient.subscribe('/app/topic/public', (message: IMessage) => {
    //     console.log('Received:', JSON.parse(message.body));
    //   });
    // };
    //  this.stompClient.onConnect = () => {
      // console.log('Connected');

      // Subscribe to my private queue
      this.stompClient.subscribe('/user/queue/private', (message: IMessage) => {
        const body = JSON.parse(message.body);
        console.log('Private message received:', body);
        this.messagesSubject.next(body);
      });

       this.stompClient.subscribe(`/user/queue/typing`, (message: IMessage) => {
      const body = JSON.parse(message.body);
        console.log('Private Typing received:', body);
        this.typingSubject.next(body);
    });
     };
     

    this.stompClient.activate();
  }

  sendPublicMessage(content: string) {
    this.stompClient.publish({
      destination: '/app/chat.sendPublic',
      body: JSON.stringify({
        senderId: '1001',
        content,
        type: 'CHAT'
      })
    });
  }

  sendPrivateMessage(receiverId: string, productId: string, message: any) {
    console.log("Publishing message to:", `/app/chat.private.${receiverId}.${productId}`);
    console.log("Payload:", message);

    this.stompClient.publish({
      destination: `/app/chat.private.${receiverId}.${productId}`,
      body: JSON.stringify(message)
    });
  }

  tpyingMessage(userId:string): Observable<any> {
  return new Observable(observer => {
     this.stompClient.subscribe(`/user/queue/typing`,(message: IMessage) => {
        console.log('>>>>>> Typing Message',JSON.stringify(message.body))
      observer.next(JSON.parse(message.body) as any);
    });

  });
  }

   typing(typing:boolean,userId:string,selectedUserId:string) {
   
      this.stompClient.publish({
        destination: `/app/typing`,
        body:JSON.stringify({
          senderId: userId,
          receiverId: selectedUserId,
          typing: typing
        })
      }
      );
    
    }


  uploadSingleFile(file: File, refDocNo: string, type:any) {
    const params = new HttpParams().set('refDocNo', refDocNo).set('type', type);
    // const headers = new HttpHeaders({'Content-Type': 'multipart/form-data', 'accept': '*/*'});
    const formdata: FormData = new FormData();
    formdata.append('multipartFile', file);
    return this.http.post(`storage/single-upload`, formdata, { params: params}).pipe(first());
  }

  getDownload(blob?: any, name?: any) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/octet-stream',
        Accept: 'application/octet-stream',
        observe: 'response'
      })
    }; 
    return this.http.get(`storage/download?blobName=${blob}&fileName=${name}`,
      { responseType: 'blob' }).pipe(map(res => ({ filename: name, data: res }))).pipe(first());
  }
  

  getUserData(userId:any, productId:any) {
    return this.http.get<any>(`api/users?userId=${userId}&productId=${productId}`).pipe(first());
  }

  updateUser(user: any) {
    return this.http.put<any>(`api/users`, user).pipe(first());
  }

     ngOnDestroy(): void {
     // Disconnect STOMP
    if (this.stompClient && this.stompClient.active) {
      this.stompClient.deactivate();
     
    }
  }
  getAttachments(params: any): Observable<any> {
    return this.http.get(`api/messages/attachment-list`, { params });
  }
  getChatGroupList(userId: any): Observable<any> {
    return this.http.get(`api/group/list?userId=${userId}`);
  }
  createGroupChannel(postData: any) {
    return this.http
      .post<any>(`api/group/create`, postData)
      .pipe(first());
  }
  getMessagesWithGroup(groupId: string): Observable<any[]> {
    return this.http.get<any[]>(`api/group?groupId=${groupId}`);
  }
}