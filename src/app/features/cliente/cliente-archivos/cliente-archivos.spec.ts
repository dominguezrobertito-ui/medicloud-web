import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteArchivos } from './cliente-archivos';

describe('ClienteArchivos', () => {
  let component: ClienteArchivos;
  let fixture: ComponentFixture<ClienteArchivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteArchivos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteArchivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
