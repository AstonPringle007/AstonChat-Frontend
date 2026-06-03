import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';
import { ChatService } from '../../auth/chat.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-team-dialog',
  templateUrl: './create-team-dialog.component.html',
  styleUrls: ['./create-team-dialog.component.scss'],
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    CommonModule
  ],
})
export class CreateTeamDialogComponent implements OnInit {
  groupForm!: FormGroup;
  @ViewChild('privatePublicRef') privatePublicRef!: TemplateRef<any>;
  isPrivateGroup: string = 'private';
  subscription = new Subscription();
  userId: any;

  constructor(private fb: FormBuilder, private dialog: MatDialog,
    private chatService: ChatService,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    this.userId = this.data.userId;
    this.groupForm = this.fb.group({
      groupId: [''],
      groupName: ['', Validators.required],
      groupDescription: [''],
      groupProfilePicture: [''],
      createdBy: [this.userId],
      type: [''],
      groupMembersDTOList: this.fb.array([
        this.createGroupMember()
      ])
    });
  }

  /** Helper method to create a member form group */
  createGroupMember(): FormGroup {
    return this.fb.group({
      groupId: [''],
      userId: [this.userId],
      role: ['Admin'],
      id: [0]
    });
  }

  /** Getter for form array */
  get groupMembers(): FormArray {
    return this.groupForm.get('groupMembersDTOList') as FormArray;
  }

  /** Add a new member dynamically */
  addMember(): void {
    this.groupMembers.push(this.createGroupMember());
  }

  /** Remove a member by index */
  removeMember(index: number): void {
    this.groupMembers.removeAt(index);
  }

  /** Submit form */
  onSubmit(): void {
    console.log('this.groupForm.valid: ', this.groupForm.valid)
    if (this.groupForm.valid) {
      console.log('Form Value:', this.groupForm.value);
        let data = this.groupForm.getRawValue();
        data.type = this.isPrivateGroup;
        console.log('data: ', data)
        this.subscription.add(this.chatService.createGroupChannel(data).subscribe((res => {
          this.toastr.success("", "Group Created Successfully");
          this.ngOnInit();
        }), (err: any) => {
            this.toastr.warning('Attention Required', err.error.message);
        }))
    } else {
      this.toastr.warning('Attention Required', 'Please fill the mandatory Fields');
    }
  }

  onChoosePrivate() {
    const dialogRef = this.dialog.open(this.privatePublicRef, {
      width: 'auto',
      height: '20vh'
    });
  }

  onChoosePublic(type: any) {
    this.isPrivateGroup =  type;
  }

}
