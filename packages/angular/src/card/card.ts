import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  ViewEncapsulation,
  inject,
  input,
} from '@angular/core';

export type GrCardVariant = 'outlined' | 'elevated';

/**
 * Card, a composite: `<gr-card>` renders the markup contract of `.gr-card` in @grass-ds/css and owns
 * no styles itself, so the host application must load @grass-ds/tokens and @grass-ds/css.
 *
 * The host element has no role. Give it one only together with an accessible name, for example
 * `<gr-card role="article" aria-labelledby="plan-title">`. Its parts are attribute directives on
 * whatever elements the consumer chooses (`<header grCardHeader>`, `<h3 grCardTitle>`...), so the
 * heading level is never hard-coded.
 */
@Component({
  selector: 'gr-card',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'gr-card',
    '[attr.data-variant]': 'resolvedVariant()',
  },
})
export class GrCard {
  /**
   * Visual variant, set as `data-variant` on the host. A bound `variant` wins; otherwise a static
   * `data-variant` written on `<gr-card>` is kept; otherwise it is `outlined`.
   */
  readonly variant = input<GrCardVariant>();

  // A host binding would overwrite an attribute the consumer wrote in the template, so the authored
  // value is read once.
  private readonly authoredVariant =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.getAttribute('data-variant');

  protected resolvedVariant(): string {
    return this.variant() ?? this.authoredVariant ?? 'outlined';
  }
}

/** `.gr-card__header`: the title and, optionally, the actions. */
@Directive({ selector: '[grCardHeader]', host: { class: 'gr-card__header' } })
export class GrCardHeader {}

/** `.gr-card__title`: put it on the heading element that fits the page (`<h2>`, `<h3>`...). */
@Directive({ selector: '[grCardTitle]', host: { class: 'gr-card__title' } })
export class GrCardTitle {}

/** `.gr-card__actions`: controls on the right of the header. */
@Directive({ selector: '[grCardActions]', host: { class: 'gr-card__actions' } })
export class GrCardActions {}

/** `.gr-card__media`: an image or video at full width; rounded where it meets the card's corners. */
@Directive({ selector: '[grCardMedia]', host: { class: 'gr-card__media' } })
export class GrCardMedia {}

/** `.gr-card__body`: the content; it takes the spare height so footers line up in a grid. */
@Directive({ selector: '[grCardBody]', host: { class: 'gr-card__body' } })
export class GrCardBody {}

/** `.gr-card__footer`: actions under the content. */
@Directive({ selector: '[grCardFooter]', host: { class: 'gr-card__footer' } })
export class GrCardFooter {}

/** Everything a template needs: `imports: [GR_CARD]`. */
export const GR_CARD = [
  GrCard,
  GrCardHeader,
  GrCardTitle,
  GrCardActions,
  GrCardMedia,
  GrCardBody,
  GrCardFooter,
] as const;
