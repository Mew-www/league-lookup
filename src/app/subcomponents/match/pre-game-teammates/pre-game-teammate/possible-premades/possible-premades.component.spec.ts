import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PossiblePremadesComponent } from './possible-premades.component';

describe('PossiblePremadesComponent', () => {
  let component: PossiblePremadesComponent;
  let fixture: ComponentFixture<PossiblePremadesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PossiblePremadesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PossiblePremadesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
