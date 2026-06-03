export interface Message {
  // senderId: string;
  // content: string;
  sentAt: string;
  messageText: string;
  productId?: string;
  receiverId?: string;
  receiverName?: string;
  senderId: string;
  senderName?: string;
  chatMessageFiles?: any;
}
