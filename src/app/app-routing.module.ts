import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { AuthGuard } from './auth/auth.guard';
import { CreateTeamDialogComponent } from './pages/create-team-dialog/create-team-dialog.component';
import { AddMembersDialogComponent } from './pages/add-members-dialog/add-members-dialog.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatRoomComponent, canActivate: [], },
  //  { path: 'chat', component: ChatRoomComponent, canActivate: [AuthGuard], },
  { path: 'create-team-dialog', component: CreateTeamDialogComponent },
  { path: 'add-members', component: AddMembersDialogComponent },
  {
    path: 'chatlogin/:token',
    canActivate: [AuthGuard],
    component: ChatRoomComponent
  },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

