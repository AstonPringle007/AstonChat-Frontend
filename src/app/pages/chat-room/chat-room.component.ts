import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ChatService } from '../../auth/chat.service';
import { Message } from '../model/message.model';
import { AuthService } from '../../auth/auth.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { STATIC } from '../../auth/static';
import { CreateTeamDialogComponent } from '../create-team-dialog/create-team-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { GroupMessage } from '../model/groupMessage.model';
import { AddMembersDialogComponent } from '../add-members-dialog/add-members-dialog.component';


@Component({
  selector: 'app-chat-room',
  standalone: false,
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss']
})
export class ChatRoomComponent implements OnInit, AfterViewChecked, OnDestroy {
  userId: any | '';
  userName: any | '';
  message = '';
  messages: Message[] = [];
  groupMessages: GroupMessage[] = [];
  productId: any | '';
  users: any[] = [];
  selectedUserId: any;
  errorMessage: any;
  selectedUserName: any;
  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  isReceiverSelectedUser = false;

  private shouldScroll = false;
  searchText = '';
  searchTextHeader = '';
  dragging = false;
  loaded: boolean = false;
  displayedColumns: string[] = ['name', 'sharedBy', 'date'];
  typingMessage = '';
  isReceiverTyping = false;
  typingTimeout: any;
  typingUser: any | null = null;
  private subs: Subscription[] = [];
  selectedUser = {
    username: '',
    imageUrl: ''
  };
  attachments: any[] = [];
  public dataSource = new MatTableDataSource();
  pageIndex = 0;
  pageSize = 20;
  isProfileOpen = false;
  companyName = "Rekochain";
  sharedFiles: { fileName: string; fileUrl: string; uploadedBy: string; uploadedAt: Date }[] = [];
  private destroy$ = new Subject<void>();
  image = new Image();
  imageLoaded = false;
  currentFile: any;
  usercode: string = '';
  emailId: string = '';
  activeColor = 'green';
  baseColor = '#ccc';
  overlayColor = 'rgba(255,255,255,0.5)';
  messageHtml = '';
  showFormatting = false;
  myProfileData: any;
  profileImage: any;
  selectedProfileUrl: any;
  recieverProductId: any;
  showProfileImg: boolean = false;
  activeTab: 'chat' | 'shared' | 'izChannel' = 'chat';
  totalItems = 0;   // total records from backend
  pageSizeFiles = 10;
  pageIndexFiles = 0;
  uploadFileType: any = 'excel';
  fileTypeList: any[] = [];
  @ViewChild('popupRef') popupRef!: ElementRef;
  profileAlt: any = 'IZ';
  selectedUserProfileAlt: string = 'IZ';
  showHeaderDropdown = false;
  showHeader2Dropdown = false;
  userHeaderList: any[] = [];
  activeListTab: 'chats' | 'channels' = 'chats';
  channelsList = [
    { id: 1, groupName: 'General', groupId: '12' },
  ];
  channelsListLength: number = 0;
  visibleUsers: any[] = [];
  usersPerPage = 10;
  currentIndex = 0
  isUserChannel: boolean = false;
  selectedGroupId: any;
  isGroupChannel: boolean = false;
  selectedGroupName: any;
  isAdmin: boolean = false;
   @ViewChild('groupProfileRef') groupProfileRef!: TemplateRef<any>;
   groupRename: string = '';
   imageLoadGroupTrue: boolean = false;

  constructor(private chatService: ChatService, private auth: AuthService,
    private toastr: ToastrService, private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    console.log('this.auth: ', this.auth.getUserData());
    this.userId = this.auth.getUserID();
    this.userName = this.auth.getUserUserName();
    console.log('this.userName : ', this.userName)
    this.productId = this.auth.getUserProductID();
    this.emailId = this.auth.getUserEmailID;
    this.profileAlt = this.auth.getProfileAlt();
    this.profileImage = this.auth.getProfileImageUrl();
    console.log('this.profileImage: ', this.profileImage)
    if(this.auth.getUserData().role === 'ADMIN') {
      this.isAdmin = true;
      console.log('this.isAdmin: ', this.isAdmin)
    }
    this.usersList();
    this.chatService.connect(this.userId, this.auth.getToken());
    // Chat Message Service
    const msgsubs = this.chatService.messages$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (msg: Message) => {
        this.messages.push(msg);
        this.shouldScroll = true;
      },
      error: err => console.error('Receive error:', err),
      complete: () => console.log('Subscription complete'),
    });
    const typesubs =
      this.chatService.typing$.subscribe({
        next: (msg: any) => {
          console.log('msg: ', msg)
          if (msg) {
            const user = this.users.find(u => u.userId === msg.senderId);
            if (user) {
              console.log('user: ', user)
              if (msg.senderId === user.userId && msg.senderId !== this.selectedUserId) {
                this.isReceiverTyping = msg.typing;
                this.isReceiverSelectedUser = false;
                this.typingUser = user ? user.username : 'Someone';
              } else if (user.userId === this.selectedUserId) {
                this.typingUser = user ? user.username : 'Someone';
                this.isReceiverSelectedUser = msg.typing;
                this.isReceiverTyping = false;
              } else {
                this.isReceiverTyping = false;
                this.isReceiverSelectedUser = false;
              }
            } else {
              this.isReceiverTyping = false;
              this.isReceiverSelectedUser = false;
            }
          }
        },
        error: err => console.error('Receive error:', err),
        complete: () => console.log('Subscription complete')
      });

    this.subs.push(msgsubs, typesubs);
      // this.onChannelList('channels');
  }
  usersList() {
    this.auth.getUsersList(this.pageIndex, this.pageSize, this.searchText ? this.searchText : '').subscribe(users => {
      // optionally exclude self from list
      this.users = users.filter(u => u.userId !== this.userId);
      this.users.map(x => {
        if (x.profileURL) {
          x.imageUrl = this.auth.getUsersProfileImage(x.profileURL);
        }
        console.log('x.imageUrl: ', x.imageUrl)
      })
      console.log('this.users: ', this.users)
      if (this.users.length > 0 && !this.showHeaderDropdown) {
        this.selectUser(this.users[0].userId, this.users[0].productId, this.users[0].profileURL);
        // Allow Angular to render the messages first
      }
      this.loadUsers();
    });
  }

  usersHeaderList(event: Event) {
    const input = event.target as HTMLInputElement;
    const searchValue = input.value;
    this.showHeaderDropdown = false;
    if (searchValue.length > 0) {
      this.showHeader2Dropdown = true;
    } else {
      this.showHeader2Dropdown = false;
    }
    this.auth.getUsersList(this.pageIndex, this.pageSize, searchValue).subscribe(userHead => {
      this.userHeaderList = userHead.filter(u => u.userId !== this.userId);
      this.userHeaderList.map(x => {
        if (x.profileURL) {
          x.imageUrl = this.auth.getUsersProfileImage(x.profileURL);
        }
      })
    });
  }

  //  @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent){
  //   console.log('event: ', event)
  //   if (!this.isProfileOpen) return; // Don't check if popup isn't open

  //   if(event && ) {
  //      this.isProfileOpen = false;
  //   }
  //   // Only proceed if popupRef is available
  //   // if (this.popupRef?.nativeElement) {
  //   //   const clickedInside = this.popupRef.nativeElement.contains(event.target);
  //   //   if (!clickedInside) {
  //   //     this.isProfileOpen = false;
  //   //   }
  //   // }
  // }
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    if (this.isProfileOpen && this.popupRef && !this.popupRef.nativeElement.contains(event.target)) {
      this.isProfileOpen = false;
    }
  }

  loadSharedFiles() {
    this.chatService.getAttachments({
      pageIndex: this.pageIndexFiles,
      pageSize: this.pageSizeFiles,
      productId: this.productId,
      receiverId: this.selectedUserId,
      search: ''
    }).subscribe((res: any) => {
      if (res?.data) {
        this.dataSource.data = res.data,
          this.sharedFiles = res.data.map((file: any) => ({
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            uploadedBy: file.uploadedBy,
            uploadedAt: file.uploadedAt
          }));
        this.totalItems = res?.length;
      }
    });
  }

  onSearch() {
    // this.showHeaderDropdown = true;
    this.usersList();
  }
  onEnter(event: KeyboardEvent) {
    if (event.shiftKey) return; // allow Shift+Enter
    event.preventDefault();

    if (!this.message.trim() && this.attachments.length === 0) {
      this.errorMessage = 'Please type a message to continue';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.sendMessage();
  }



  sendMessage(): void {
    if (!this.selectedUserId) return;

    if (this.isMessageEmpty(this.message) && this.attachments.length === 0) {
      this.errorMessage = 'Please type a message to continue';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    const msg: Message = {
      senderId: this.userId,
      productId: this.productId,
      receiverId: this.selectedUserId,
      messageText: this.message,
      sentAt: new Date().toISOString(),
      senderName: this.userName,
      chatMessageFiles: this.attachments
    };

    console.log('msg: ', msg)
    this.messages.push(msg);
    this.message = '';
    this.shouldScroll = true;

    this.chatService.sendPrivateMessage(this.selectedUserId, this.recieverProductId, msg);
    this.errorMessage = '';
    this.attachments = [];
  }

  isMessageEmpty(msg: string): boolean {
    if (!msg) return true;
    // Convert HTML string to plain text
    const div = document.createElement('div');
    div.innerHTML = msg;
    const text = div.textContent?.replace(/\u00a0/g, '').trim(); // remove   too
    return !text; // true if empty
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }


  selectUser(userId: string, productId: string, profileUrl: any) {
    console.log('userId: ', userId);
    this.isUserChannel = false;
    this.isGroupChannel = false;
    if (this.showHeader2Dropdown) {
      this.searchTextHeader = '';
      this.showHeader2Dropdown = false;
    }
    if (profileUrl) {
      this.showProfileImg = true;
      console.log('this.selectedProfileUrl: ', this.selectedProfileUrl)
      console.log('this.showProfileImg: ', this.showProfileImg);
      this.selectedProfileUrl = this.auth.getUsersProfileImage(profileUrl);
    }
    else {
      this.showProfileImg = false;
    }
    this.selectedUserId = userId;
    this.activeTab = 'chat';
    this.recieverProductId = productId;
    const user = this.users.find(u => u.userId === userId);
    console.log('user: ', user);
    this.selectedUserName = `${user.firstName} ${user.lastName}`;
    this.selectedUserProfileAlt = user.profileAlt;
    console.log('this.selectedUserName: ', this.selectedUserName);
    // Load messages or set current chat user here
    this.message = '';
    this.messages = [];
    this.auth.getMessagesWithUser(userId, productId, this.userId, this.productId).subscribe(messages => {
      this.messages = messages;
      console.log('this.messages: ', this.messages)
      this.shouldScroll = true;
    });
  }

  selectChannels(channel: any) {
    console.log('channel: ', channel);
    this.isGroupChannel = true;
    this.isUserChannel = false
    this.activeListTab = 'channels';
    this.selectedGroupId = channel.groupId;
    this.chatService.getMessagesWithGroup(this.selectedGroupId).subscribe((messages: any) => {
      this.groupMessages = messages.data.groupMembersDTOList;
      this.selectedGroupName = messages.data.groupName;
      this.shouldScroll = true;
    }); 
  }

  onFileList(tab?: any) {
    this.activeTab = 'shared';
    this.loadSharedFiles();
  }

  logout() {
    this.auth.logout();
  }

  toggleProfilePopup(event: MouseEvent) {
    event?.stopPropagation();
    this.isProfileOpen = !this.isProfileOpen;
    if (this.isProfileOpen) {
      this.getUser();
    }
  }

  getUser() {
    this.chatService.getUserData(this.userId, this.productId).subscribe({
      next: (res: any) => {
        this.myProfileData = res.data;
        console.log('res: ', res)

      },
      error: () => {
        // this.notificationService.warningAlert(
        // "Attention Required",
        // "Upload failed. Please re-upload!"
        // );
      },
    });
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  onAttachmentsSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files: FileList = input.files;

    Array.from(files).forEach(file => {
      console.log("File Name:", file.name);
      console.log("File Type:", file.type);

      let fileType = 'otherFile'; // default

      if (this.isExcelFile(file)) {
        fileType = 'excel';
        console.log("Excel file uploaded ✅");
      } else if (this.isImageFile(file)) {
        fileType = 'image';
        console.log("Image file uploaded ✅");
      } else if (this.isPdfFile(file)) {
        fileType = 'pdf';
        console.log("PDF file uploaded ✅");
      } else if (this.isTextFile(file)) {
        fileType = 'textFile';
        console.log("Text file uploaded ✅");
      } else if (this.isWordFile(file)) {
        fileType = 'word';
        console.log("Word file uploaded ✅");
      } else {
        fileType = 'textFile';
        console.log("Other file type ❌");
      }

      // ✅ push per-file type
      this.fileTypeList.push({
        name: file.name,
        type: fileType
      });

      // upload each file
      this.uploadAttachment(file, fileType);
    });

    console.log('this.fileTypeList: ', this.fileTypeList);

    // reset input so user can reselect same file
    event.target.value = '';
  }



  isExcelFile(file: File): boolean {
    return (
      file.type === "application/vnd.ms-excel" || // .xls
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
    );
  }

  isPdfFile(file: File): boolean {
    return file.type === "application/pdf";
  }

  isTextFile(file: File): boolean {
    return file.type === "text/plain";
  }

  isWordFile(file: File): boolean {
    return (
      file.type === "application/msword" || // .doc (older Word files)
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/'); // catches jpg, jpeg, png, gif, webp etc.
  }

  uploadAttachment(file: File, fileType: any) {
    let userID = this.usercode;
    let fileName = `${this.productId}/${this.userId}`;
    this.chatService.uploadSingleFile(file, fileName, "Attachments").subscribe({
      next: (res: any) => {
        console.log('res: ', res)
        // Assuming API returns { fileUrl: '...' }
        this.attachments.push({
          attachmentId: res.uuid, // uuid from API
          fileName: file.name, // original file name
          fileUrl: res.refNo, // refNo from API
          fileType: fileType
        });
        console.log('this.attachments: ', this.attachments)
      },
      error: (err) => {
        console.error('Attachment upload failed', err);
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndexFiles = event.pageIndex;
    this.pageSizeFiles = event.pageSize;
    this.loadSharedFiles();
  }

  removeAttachment(index: number) { // NEW
    this.attachments.splice(index, 1);
  }

  onTyping() {
    this.chatService.typing(true, this.userId, this.selectedUserId);
    // Stop typing after 2 seconds of inactivity
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.typingUser = null,
        this.isReceiverTyping = false,
        this.isReceiverSelectedUser = false;
      this.chatService.typing(false, this.userId, this.selectedUserId);
    }, 2000);


  }

  handleDragEnter() {
    this.dragging = true;
  }
  handleDragLeave() {
    this.dragging = false;
  }
  handleDrop(e: any) {
    e.preventDefault();
    this.dragging = false;
    this.handleInputChange(e);
  }
  _handleReaderLoaded(e: any) {
    const reader = e.target;
    console.log('e.target: ', e.target);
    // this.user.image = reader.result;
    var inserted = e.target.result;
    this.image.src = inserted;

    // var imageName = 'name.jpeg'
    // this.currentFile = new File([inserted],imageName,{type:'image/jpg'});
    this.loaded = true;
  }

  handleImageLoad() {
    this.imageLoaded = true;
  }

  handleInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const pattern = /image-*/;

    if (!file.type.match(pattern)) {
      alert('Invalid format');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // this.company.image = reader.result as string;
      this.loaded = true;
    };
    reader.readAsDataURL(file);
    this.uploadDoc(file);
  }

  
  handleDragEnter1() {
    this.dragging = true;
  }
  handleDragLeave1() {
    this.dragging = false;
  }
  handleDrop1(e: any) {
    e.preventDefault();
    this.dragging = false;
    this.handleInputChange(e);
  }
  _handleReaderLoaded1(e: any) {
    const reader = e.target;
    console.log('e.target: ', e.target);
    // this.user.image = reader.result;
    var inserted = e.target.result;
    this.image.src = inserted;

    // var imageName = 'name.jpeg'
    // this.currentFile = new File([inserted],imageName,{type:'image/jpg'});
    this.loaded = true;
  }

  handleImageLoad1() {
    console.log('this.imageLoaded: ', this.imageLoaded)
    this.imageLoaded = true;
  }

  handleInputChange1(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const pattern = /image-*/;

    if (!file.type.match(pattern)) {
      alert('Invalid format');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // this.company.image = reader.result as string;
      this.loaded = true;
    };
    reader.readAsDataURL(file);
    this.uploadDoc(file);
  }

  onGroupImageClick() {
    this.imageLoadGroupTrue = false;
    console.log('onlll: ')
  }
  
  dataURLtoFile(dataurl: any, filename: any) {

    var arr = dataurl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], filename, { type: mime });
  }

  uploadDoc(file: File) {
    let userID = this.usercode;
    let fileName = `${this.productId}/${this.userId}`;
    this.chatService.uploadSingleFile(file, fileName, "Profile").subscribe({
      next: (res: any) => {
        console.log('res: ', res)
        this.myProfileData.profileURL = res.refNo;
        // this.user.image = res.data;
        this.updateProfileImg();
      },
      error: () => {
        // this.notificationService.warningAlert(
        // "Attention Required",
        // "Upload failed. Please re-upload!"
        // );
      },
    });
  }


  uploadAttachments(file: File) {
    let userID = this.usercode;
    let fileName = `${this.productId}/${this.userId}`;
    this.chatService.uploadSingleFile(file, fileName, "Attachments").subscribe({
      next: (res: any) => {
        console.log('res: ', res);
        // this.messag = res.refNo;
        // this.user.image = res.data;

      },
      error: () => {
        // this.notificationService.warningAlert(
        // "Attention Required",
        // "Upload failed. Please re-upload!"
        // );
      },
    });
  }

  updateProfileImg() {
    this.chatService.updateUser(this.myProfileData).subscribe({
      next: (res: any) => {
        this.toastr.success("", "User Profile updated");
        this.ngOnInit();
      },
      error: (error) => {
        this.toastr.success("Attention required", error.error.message);
      },
    });
  }

  toggleFormatting() {
    // this.messageHtml = this.message;
    this.showFormatting = !this.showFormatting;

  }

  execCommand(command: string) {
    document.execCommand(command, false, '');
  }

  sanitizeMessage(text?: string): string {
    if (!text) return '';
    return text.replace(/<\/?p>/g, '').trim();
  }

  hasTextAndAttachment(msg: any): boolean {
    const message = this.sanitizeMessage(msg?.messageText);
    const hasMessageText = !!message && message.trim().length > 0;
    const hasAttachments = msg?.chatMessageFiles?.length > 0;
    return hasMessageText && hasAttachments;
  }


  onFileClick(file: any) {
    console.log("File clicked:", file);

  }

  downloadDocument(file: any) {
    console.log('file: ', file);
    let fileAttach = `${file.fileUrl}`;
    // const url = URL.createObjectURL(data.data);
    //         const a = document.createElement('a');
    //         document.body.appendChild(a);
    //         a.setAttribute('style', 'display: none');
    //         a.href = url;
    //         a.download = data.filename;
    //         a.click();
    this.chatService.getDownload(fileAttach, file.fileName).subscribe(
      (data: any) => {
        // Create a blob from the response data
        console.log(data, data.data)
        const blob = new Blob([data.data], { type: data.type }); // Set the type appropriately based on the file type
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;
        a.download = data.filename; // Ensure data.filename is provided
        a.click();
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error => {
        // this.notificationService.warningAlert('Error', 'Failed to download the file.');
      }
    );
  }

  getInitials(name: string | null | undefined): string {
    if (!name) return '';
    return name
      .split(' ')
      .filter(n => n) // avoid empty if double spaces
      .map(n => n.charAt(0).toUpperCase())
      .join('');
  }

  closeDropdown() {
    setTimeout(() => this.showHeaderDropdown = false, 200);
    setTimeout(() => this.showHeader2Dropdown = false, 200);
  }

  openDropdown() {
    // this.showHeaderDropdown = false;
    // if(this.searchTextHeader.length === 0) {
    this.showHeaderDropdown = true;
    this.usersList();
    // }
  }

  loadUsers() {
    const nextIndex = this.currentIndex + this.usersPerPage;
    this.visibleUsers = this.users.slice(0, nextIndex);
    console.log('this.visibleUsers: ', this.visibleUsers)
    this.currentIndex = nextIndex;
  }

  seeMore() {
    this.loadUsers();
  }

  onViewChannel() {
    this.isUserChannel = true;
    this.isGroupChannel = false;
    this.activeTab = 'izChannel';
  }

  openCreateTeamDialog() {
    this.dialog.open(CreateTeamDialogComponent, {
      width: '500px',
      panelClass: 'create-team-dialog-container',
      data: {
        userId: this.userId
      }
    });
  }

  onChannelList(tab: any) {
    console.log('this.userId: ', this.userId)
    this.activeListTab = tab;
    this.chatService.getChatGroupList(this.userId).subscribe((res: any) => {
      this.channelsList = res;
      this.channelsListLength = res.length;
      console.log('this.channelsList: ', this.channelsList)
      
    });
  }

  openAddMembersDialog(button: HTMLElement) {
  const rect = button.getBoundingClientRect();

  const dialogWidth = 300; // match your dialog width
  const screenWidth = window.innerWidth;

  // Default left position
  let left = rect.left + window.scrollX;

  // If the dialog would overflow to the right, shift it left
  if (left + dialogWidth > screenWidth - 8) { // 8px padding from right edge
    left = screenWidth - dialogWidth - 8; // shift to fit inside viewport
  }

  this.dialog.open(AddMembersDialogComponent, {
    width: `${dialogWidth}px`,
    panelClass: 'custom-dialog-container',
    position: {
      top: `${rect.bottom + 8 + window.scrollY}px`, // below button
      left: `${left}px`
    },
    data: this.groupMessages
  });
}


onEditGroupProfile(event: MouseEvent) {
  this.dialog.open(this.groupProfileRef, {
    width: '90%', // Responsive: 90% of screen width
    maxWidth: '400px', // But never exceed 400px
    height: 'auto',
    hasBackdrop: true,
    panelClass: 'group-dialog'
  });
}

saveGroup() {
  this.selectedGroupName = this.groupRename;
}

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subs.forEach(s => s.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();

  }
}

