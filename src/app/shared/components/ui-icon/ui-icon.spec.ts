import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconName, UiIcon } from './ui-icon';

describe('UiIcon', () => {
  let fixture: ComponentFixture<UiIcon>;

  function renderShapes(name: IconName): number {
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelectorAll('path, circle, rect').length;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UiIcon] });
    fixture = TestBed.createComponent(UiIcon);
    fixture.componentRef.setInput('name', 'car');
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('dibuja el icono de motocicleta', () => {
    expect(renderShapes('motorcycle')).toBeGreaterThan(0);
  });

  it('dibuja el icono de camioneta', () => {
    expect(renderShapes('pickup')).toBeGreaterThan(0);
  });

  it('dibuja el icono de automóvil', () => {
    expect(renderShapes('car')).toBeGreaterThan(0);
  });
});
