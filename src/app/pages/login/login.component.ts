import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  productList: any[] = [];
  productId: string = '';
  formSubmitted: boolean = false;
  showEyeIcon: boolean = false;
  type: string = 'password';
  hide = false;
  visible = 'visibility_off';
  subscription: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cd: ChangeDetectorRef,
    protected dialog: MatDialog,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
      // product: ['', [Validators.required]]
    });
  }
  ngOnInit(): void {
    this.authService.logout();
    this.productDropdown();
    // this.valueChange();
  }
  // valueChange() {
  //   this.loginForm.controls['product'].valueChanges.subscribe((val) => {
  //     if (val) {
  //       this.productId = val;
  //     }
  //   });
  // }
  togglePassword() {
    this.type = this.type === 'password' ? 'text' : 'password';
    this.cd.markForCheck();
  }
  onPasswordInput() {
    const value = this.loginForm.get('password')?.value;
    this.showEyeIcon = !!value;
  }
  productDropdown() {
    let data = {
      includeId: [''],
      excludeId: [''],
      search: ''
    }
    this.authService.getProductDropdown(data).subscribe({
      next: (response: any) => {
        this.productList = response.data;
      },
      error: (error) => {
        this.errorMessage = 'Invalid username or password';
      }
    });
  }

 onSubmit(): void {
  this.formSubmitted = true;

  if (this.loginForm.valid) {
    const { username, password } = this.loginForm.value;

    // this.authService.login(username, password, this.productId).subscribe({
    //   next: (success: boolean) => {
    //     if (success) {
          this.toastr.success('Welcome to Chat', 'Success', { timeOut: 4000 });
          this.router.navigate(['/chat']);
    //     }
    //   },
    //   error: (error) => {
    //     const msg = error.error.message || 'Invalid username or password';
    //     this.toastr.error(msg, 'Attention Required', { timeOut: 4000 });
    //   }
    // });

  } else {
    this.toastr.warning("Please fill required fields");
  }
}


  get f() {
    return this.loginForm.controls;
  }

  openDialog(): void {
    // const dialogRef = this.dialog.open(ForgotPasswordComponent, {
    //   data: status,
    //   panelClass: 'bg-grey-dialog'
    // });
    // this.subscription.add(dialogRef.afterClosed().subscribe((result: any) => {
    //   if (result) {
    //     this.loginForm.value.user_Name = result.user_Name;
    //     this.loginForm.value.password = result.password;
    //     this.login();
    //   }
    // }));
  }
}
