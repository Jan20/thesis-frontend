import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { FirestoreStub } from 'src/app/misc/firestore.stub';

describe('UserService', () => {

  beforeEach(() => TestBed.configureTestingModule({

    providers: [
    
      { provide: AngularFirestore, useValue: FirestoreStub }
    
    ],


  }));

  it('should be created', () => {

    const service: UserService = TestBed.get(UserService)
    expect(service).toBeTruthy()
  
  })

});
