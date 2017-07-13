import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LobbyGeneratorComponent } from './lobby-generator.component';

describe('LobbyGeneratorComponent', () => {
  let component: LobbyGeneratorComponent;
  let fixture: ComponentFixture<LobbyGeneratorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LobbyGeneratorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LobbyGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
