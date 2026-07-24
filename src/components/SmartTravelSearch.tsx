import { Bot, MapPin, Send, Sparkles, Star, WalletCards } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { CatalogService, ServiceKind } from '../types';
import { cleanSearchText, getBookableDates, getJordanTodayIso } from '../validation';
import { formatMoney, serviceKinds } from '../domain';

interface SmartTravelSearchProps {
  services: CatalogService[];
  onSelectService: (service: CatalogService) => void;
}

interface AssistantMessage {
  role: 'assistant' | 'user';
  text: string;
  serviceIds?: string[];
}

const typeTerms: Record<ServiceKind, string[]> = {
  trip: ['رحلة داخلية', 'رحلات داخلية', 'داخل الاردن', 'داخل الأردن', 'محلي', 'بتراء', 'وادي رم', 'عقبة', 'جرش', 'عجلون'],
  intl_trip: ['رحلة خارجية', 'رحلات خارجية', 'سفر خارجي', 'باقة دولية', 'تركيا', 'مصر', 'مالديف', 'قبرص', 'لبنان'],
  hotel: ['فندق', 'فنادق', 'اقامة', 'إقامة', 'منتجع', 'غرفة'],
  car: ['سيارة', 'سيارات', 'تأجير سيارة', 'استئجار سيارة'],
  flight: ['طيران', 'تذكرة طيران', 'رحلة جوية', 'مطار'],
  bus_train: ['حافلة', 'حافلات', 'باص', 'قطار', 'نقل سياحي'],
  hajj_umrah: ['عمرة', 'حج', 'مكة', 'مدينة منورة'],
  insurance: ['تأمين', 'تامين سفر', 'تأمين سفر'],
  visa: ['تأشيرة', 'تاشيرة', 'فيزا'],
  consultation: ['استشارة', 'تخطيط رحلة', 'مساعدة سفر'],
};

const stopWords = new Set(['اريد', 'أريد', 'ابحث', 'أبحث', 'عن', 'في', 'الى', 'إلى', 'من', 'مع', 'لي', 'لو', 'ممكن', 'خدمة', 'رحلة', 'سفر', 'افضل', 'أفضل']);
const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
const normalizeDigits = (value: string): string => value.replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
const normalize = (value: string): string => cleanSearchText(normalizeDigits(value)).replace(/\bال/g, '');

const extractBudget = (query: string): number | null => {
  const normalized = normalizeDigits(query);
  const numbers = [...normalized.matchAll(/\d{1,6}(?:\.\d{1,2})?/g)].map((match) => Number(match[0])).filter((value) => Number.isFinite(value) && value > 0);
  if (!numbers.length) return null;
  const budgetLanguage = /(ميزاني|بحدود|حدود|اقل|أقل|تحت|حتى|ما يتجاوز|دينار|د\.أ)/i.test(query);
  return budgetLanguage ? Math.max(...numbers) : null;
};

const matchKinds = (query: string): Set<ServiceKind> => {
  const normalized = normalize(query);
  const result = new Set<ServiceKind>();
  (Object.entries(typeTerms) as [ServiceKind, string[]][]).forEach(([kind, terms]) => {
    if (terms.some((term) => normalized.includes(normalize(term)))) result.add(kind);
  });
  return result;
};

const serviceCorpus = (service: CatalogService): string => normalize([
  service.title,
  service.description,
  service.location || '',
  service.office.name,
  service.category?.nameAr || '',
  service.included.join(' '),
  service.duration || '',
  serviceKinds[service.type].label,
].join(' '));

export function SmartTravelSearch({ services, onSelectService }: SmartTravelSearchProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    { role: 'assistant', text: 'احكيلي شو مخطط لرحلتك: الوجهة، الميزانية، المدة أو نوع الخدمة. سأحلل طلبك وأرتب لك أفضل الخدمات المنشورة فعليًا.' },
  ]);
  const today = useMemo(() => getJordanTodayIso(), []);
  const serviceMap = useMemo(() => new Map(services.map((service) => [service.id, service])), [services]);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const raw = query.trim();
    if (!raw) return;

    const normalized = normalize(raw);
    const budget = extractBudget(raw);
    const kinds = matchKinds(raw);
    const wantsAvailable = /(متاح|موعد|قريب|هذا الاسبوع|هذا الأسبوع|فورا|فوراً)/.test(normalized);
    const wantsCheap = /(رخيص|اقتصادي|اوفر|أوفر|اقل سعر|أقل سعر)/.test(normalized);
    const wantsPremium = /(فاخر|فخمة|ديلوكس|خمسة نجوم|5 نجوم)/.test(normalized);
    const wantsFamily = /(عائل|اطفال|أطفال|اسرة|أسرة)/.test(normalized);
    const wantsRating = /(تقييم|موثوق|مضمون|افضل|أفضل)/.test(normalized);
    const tokens = normalized.split(/\s+/).filter((token) => token.length > 1 && !stopWords.has(token)).slice(0, 18);

    const ranked = services.map((service) => {
      const corpus = serviceCorpus(service);
      let score = service.rating * 1.4;
      const reasons: string[] = [];
      const tokenMatches = tokens.filter((token) => corpus.includes(token));
      score += tokenMatches.length * 3;
      if (tokenMatches.length) reasons.push('مطابقة وصف طلبك');
      if (kinds.size && kinds.has(service.type)) { score += 18; reasons.push(serviceKinds[service.type].shortLabel); }
      if (kinds.size && !kinds.has(service.type)) score -= 5;
      if (budget != null) {
        if (service.price <= budget) { score += 12 + Math.max(0, (budget - service.price) / Math.max(budget, 1) * 3); reasons.push(`ضمن ${budget} د.أ`); }
        else score -= Math.min(18, (service.price - budget) / Math.max(budget, 1) * 12);
      }
      if (wantsCheap) score += Math.max(0, 9 - service.price / Math.max(20, Math.max(...services.map((item) => item.price), 1) / 8));
      if (wantsPremium && (service.rating >= 4.5 || /فاخر|ديلوكس|premium|5 نجوم/.test(corpus))) { score += 8; reasons.push('خيار فاخر'); }
      if (wantsFamily && /عائل|اطفال|أطفال|غرف|مرشد|نقل/.test(corpus)) { score += 7; reasons.push('مناسب للعائلة'); }
      if (wantsRating && service.rating >= 4.3) { score += 6; reasons.push(`تقييم ${service.rating.toFixed(1)}`); }
      const available = service.seatsRemaining !== 0 && (!service.availableDates.length || getBookableDates(service.availableDates, today).length > 0);
      if (wantsAvailable && available) { score += 8; reasons.push('متاح للحجز'); }
      if (wantsAvailable && !available) score -= 20;
      if (service.seatsRemaining === 0) score -= 15;
      return { service, score, reasons: [...new Set(reasons)].slice(0, 3) };
    }).sort((left, right) => right.score - left.score || right.service.rating - left.service.rating || left.service.price - right.service.price);

    const recommendations = ranked.filter((item) => item.score > 1).slice(0, 5);
    const fallback = ranked.slice(0, 5);
    const selected = recommendations.length ? recommendations : fallback;
    const kindText = kinds.size ? [...kinds].map((kind) => serviceKinds[kind].shortLabel).join('، ') : 'كل أنواع الخدمات';
    const budgetText = budget != null ? ` وميزانية حتى ${budget} د.أ` : '';
    const response = selected.length
      ? `حللت طلبك على ${services.length} خدمة منشورة. ركزت على ${kindText}${budgetText}، ورتبت النتائج حسب المطابقة والتقييم والتوفر. أول نتيجة هي الأقرب لطلبك.`
      : 'ما لقيت خدمة منشورة تطابق التفاصيل حاليًا. جرّب توسّع الميزانية أو اكتب وجهة أو نوع خدمة مختلف.';

    setMessages((current) => [...current, { role: 'user', text: raw }, { role: 'assistant', text: response, serviceIds: selected.map((item) => item.service.id) }].slice(-12));
    setQuery('');
  };

  return <section className="smart-travel-search" aria-labelledby="smart-search-title">
    <header><div className="smart-search-icon"><Sparkles size={21} /></div><div><span>مساعد سفرتك الذكي</span><h2 id="smart-search-title">صف رحلتك بطريقتك</h2><p>بحث دلالي داخل الخدمات الحقيقية، بدون اقتراح عروض غير موجودة.</p></div></header>
    <div className="smart-chat-log" aria-live="polite">
      {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`smart-message ${message.role}`}>
        <div className="smart-bubble">{message.role === 'assistant' ? <Bot size={16} /> : null}<p>{message.text}</p></div>
        {message.serviceIds?.length ? <div className="smart-recommendations">{message.serviceIds.map((id) => {
          const service = serviceMap.get(id);
          if (!service) return null;
          return <button key={id} type="button" onClick={() => onSelectService(service)}>
            <div><strong>{service.title}</strong><span><MapPin size={12} />{service.location || service.office.name}</span></div>
            <div className="smart-service-meta"><b><Star size={12} fill="currentColor" />{service.rating.toFixed(1)}</b><em><WalletCards size={12} />{formatMoney(service.price)}</em></div>
          </button>;
        })}</div> : null}
      </div>)}
    </div>
    <form onSubmit={search}><input value={query} onChange={(event) => setQuery(event.target.value.slice(0, 220))} placeholder="مثال: رحلة عائلية للعقبة أقل من 250 دينار ومتاحة قريبًا" maxLength={220} /><button type="submit" disabled={!query.trim()} aria-label="تحليل طلب السفر"><Send size={17} /></button></form>
  </section>;
}
