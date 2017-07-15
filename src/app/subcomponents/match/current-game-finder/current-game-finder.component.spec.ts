import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CurrentGameFinderComponent } from './current-game-finder.component';

describe('CurrentGameFinderComponent', () => {
  let component: CurrentGameFinderComponent;
  let fixture: ComponentFixture<CurrentGameFinderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CurrentGameFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrentGameFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
