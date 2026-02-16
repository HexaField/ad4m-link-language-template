import type { Language, LanguageContext, Interaction } from '@coasys/ad4m';
import { MyExpressionAdapter } from './adapter';
import { MyLinksAdapter } from './links';

function create(context: LanguageContext): Language {
  const expressionAdapter = new MyExpressionAdapter(context);
  const linksAdapter = new MyLinksAdapter(context);
  return {
    name: 'my-ad4m-language',
    expressionAdapter,
    linksAdapter,
    interactions: (expression: any) => [] as Interaction[],
  } as Language;
}

export const name = 'my-ad4m-language';
export default create;
