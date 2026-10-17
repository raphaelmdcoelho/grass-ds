import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { GR_CARD, GrCardVariant } from './card';

@Component({
  imports: [GR_CARD],
  template: `
    <gr-card id="full" [variant]="variant()" role="article" aria-labelledby="t">
      <header grCardHeader>
        <h4 grCardTitle id="t">Title</h4>
        <div grCardActions><button id="action">Edit</button></div>
      </header>
      <div grCardMedia><img alt="" src="data:," /></div>
      <div grCardBody id="body"><p>Body</p></div>
      <footer grCardFooter><button id="footer-action">Go</button></footer>
    </gr-card>
    <gr-card id="bare"><p id="bare-content">Just content</p></gr-card>
    <gr-card id="named" variant="elevated" class="extra" data-id="x"></gr-card>
  `,
})
class Host {
  readonly variant = signal<GrCardVariant>('outlined');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root: HTMLElement = fixture.nativeElement;
  const get = (selector: string) => root.querySelector<HTMLElement>(selector)!;
  return { fixture, host: fixture.componentInstance, get };
}

describe('GrCard', () => {
  it('puts .gr-card on the host and adds no wrapper: parts are direct children, in order', async () => {
    const { get } = await setup();
    const card = get('#full');
    expect(card.localName).toBe('gr-card');
    expect(card.classList.contains('gr-card')).toBe(true);
    expect([...card.children].map((child) => child.className)).toEqual([
      'gr-card__header',
      'gr-card__media',
      'gr-card__body',
      'gr-card__footer',
    ]);
  });

  it('projects content untouched, with no heading level of its own', async () => {
    const { get } = await setup();
    expect(get('#t').localName).toBe('h4');
    expect(get('#t').className).toBe('gr-card__title');
    expect(get('.gr-card__actions #action')).not.toBeNull();
    expect(get('#body p').textContent).toBe('Body');
    expect(get('#bare').children).toHaveLength(1);
    expect(get('#bare-content').parentElement).toBe(get('#bare'));
  });

  it('reflects the variant as data-variant and updates it', async () => {
    const { fixture, host, get } = await setup();
    expect(get('#full').getAttribute('data-variant')).toBe('outlined');
    expect(get('#named').getAttribute('data-variant')).toBe('elevated');
    host.variant.set('elevated');
    await fixture.whenStable();
    expect(get('#full').getAttribute('data-variant')).toBe('elevated');
  });

  it('has no role of its own and keeps the role, name and extra attributes the consumer wrote', async () => {
    const { get } = await setup();
    expect(get('#bare').hasAttribute('role')).toBe(false);
    expect(get('#full').getAttribute('role')).toBe('article');
    expect(get('#full').getAttribute('aria-labelledby')).toBe('t');
    expect(get('#named').classList.contains('extra')).toBe(true);
    expect(get('#named').classList.contains('gr-card')).toBe(true);
    expect(get('#named').getAttribute('data-id')).toBe('x');
  });
});
