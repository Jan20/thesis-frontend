import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { World } from './world.component';
import { AngularFirestore } from '@angular/fire/firestore';
import { FirestoreStub } from 'src/app/misc/firestore.stub';

describe('World', () => {
  let component: World;
  let fixture: ComponentFixture<World>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ World ],
      providers: [        
        
        { provide: AngularFirestore, useValue: FirestoreStub },
      
      ],
      
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(World);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
