import type { Language } from './i18n';

interface Term {
  title: string;
  definition: string;
  model: string;
  observe: string;
}

const enTerms = {
  abstraction: {
    title: 'Model abstraction',
    definition:
      'A simplified representation that keeps selected mechanisms and leaves out other details.',
    model:
      'ANT uses local rules, idealized navigation and uncalibrated units. It does not include every feature of a real colony or represent a particular species.',
    observe:
      'Use a result to explain behavior under these rules. Applying it to real ants requires separate biological evidence.',
  },
  seed: {
    title: 'Seed',
    definition: 'The starting number for the model’s repeatable sequence of random choices.',
    model:
      'The same seed, configuration, model version and tick count reproduce a run in the same runtime. The seed alone is not enough.',
    observe:
      'Keep it fixed when comparing parameters; repeat with other seeds before generalizing.',
  },
  tick: {
    title: 'Tick',
    definition: 'One complete update of the simulated world.',
    model:
      'Each tick updates every ant and both chemical fields. At 1×, the target is 60 ticks per real second.',
    observe: 'Compare runs at the same tick count. A tick is not a second of an actual ant’s life.',
  },
  population: {
    title: 'Population',
    definition: 'The number of simulated ants in the colony.',
    model:
      'All ants use the same local rules. More ants can search and deposit traces, but they do not collide with one another.',
    observe:
      'More delivered food can simply reflect more foragers; it does not by itself mean greater efficiency per ant.',
  },
  evaporation: {
    title: 'Food-signal evaporation',
    definition: 'The fraction of food-signal concentration removed on each tick.',
    model:
      '0.004 removes 0.4% per tick after diffusion. A value of 0.010 removes 1%. This changes the trace, not the amount of food.',
    observe:
      'A higher value makes unrenewed traces fade faster. New deposits can still reinforce a trail.',
  },
  exploration: {
    title: 'Exploration',
    definition: 'A parameter controlling variation in a searching ant’s direction.',
    model:
      'Higher values increase wandering and the chance of ignoring an available food signal. Zero still allows a small amount of wandering.',
    observe:
      'Compare coverage alongside deliveries: exploring more space need not deliver more food.',
  },
  foodSignal: {
    title: 'Food signal',
    definition: 'The chemical trace deposited by ants returning with food.',
    model:
      'Searching ants can follow nearby samples of this amber field. Deposits weaken with distance traveled since pickup.',
    observe:
      'A bright corridor shows accumulated signal. It does not prove the route is shortest or that food is still available.',
  },
  homeSignal: {
    title: 'Home signal',
    definition: 'The chemical trace deposited by searching ants.',
    model:
      'The sage field is displayed and sampled, but it does not steer ants in V0.1. Returning ants use their home vector.',
    observe: 'Changing the displayed layer changes what you see, not the ants’ behavior.',
  },
  homeVector: {
    title: 'Home vector · path integration',
    definition:
      'An estimate of the direction and displacement back to the nest, updated from the ant’s own movement.',
    model:
      'Each movement is subtracted from an internal home vector. This model idealizes the calculation with effectively no accumulated drift.',
    observe:
      'A returning ant can head home without following the home chemical. Obstacles can still divert it.',
  },
  coverage: {
    title: 'Coverage',
    definition: 'The percentage of traversable grid cells that at least one ant has entered.',
    model:
      'Cells count after movement, once each. Sensor reach and repeated visits do not add new coverage.',
    observe:
      'Coverage measures visited space, not food found, route quality or how much the colony knows.',
  },
  discovery: {
    title: 'First discovery',
    definition: 'The tick when an ant first picks up a unit of food.',
    model:
      'Seeing food within sensor range is not yet a discovery in this counter. “Not yet” means no pickup has occurred.',
    observe: 'Discovery happens before delivery: the ant must still travel back to the nest.',
  },
  delivered: {
    title: 'Food delivered',
    definition: 'The cumulative number of food units brought back to the nest.',
    model:
      'Each successful return adds one unit. Food currently being carried is excluded. The plot shows this cumulative counter over recent ticks.',
    observe:
      'A rising plot means deliveries are happening. Compare totals at equal tick counts and with the same population.',
  },
  states: {
    title: 'Searching, returning & state duration',
    definition:
      'Searching ants seek food; returning ants currently carry one unit toward the nest.',
    model:
      'Searching + returning equals population. State duration counts ticks since the latest pickup or delivery transition, or since initialization.',
    observe:
      'Many returning ants can mean food was found recently; it does not mean those units are already delivered.',
  },
  throughput: {
    title: 'Deliveries / 1,000 ticks',
    definition: 'The recent delivery rate, expressed as food units per 1,000 model ticks.',
    model:
      'It counts deliveries in the last 1,000 ticks. During startup, the shorter elapsed time is scaled to that window.',
    observe:
      'Use it for recent activity. The cumulative delivered total can rise while this rate falls.',
  },
  distance: {
    title: 'Mean round trip',
    definition: 'The average distance traveled for trips that ended in a food delivery.',
    model:
      'It includes both outward exploration and the return. Unfinished trips are excluded; “u” means uncalibrated model distance units.',
    observe:
      'A dash means no delivery has finished. This is not straight-line nest-to-food distance.',
  },
  remaining: {
    title: 'Food remaining',
    definition: 'Food units still present at the sources.',
    model: 'Initial food = remaining food + food carried by returning ants + delivered food.',
    observe: 'Remaining food falls at pickup, while delivered food rises only at the nest.',
  },
  probes: {
    title: 'Signal probes',
    definition: 'Three nearby samples to the left, ahead and right of an ant.',
    model:
      'The inspector lists food-signal concentration at these samples. Blocked samples read zero. These are model values, not chemical measurements.',
    observe:
      'Pause, select an ant and show its sensors. Step once and compare the readings with its decision.',
  },
  decision: {
    title: 'Local decision',
    definition: 'The rule an ant used to choose its most recent movement.',
    model:
      'It can explore, approach nearby food, follow food signal, use its home vector or avoid an obstacle. It receives no global route map.',
    observe:
      'The strongest probe does not always win: nearby targets, obstacles, carrying state and exploration also matter.',
  },
  pheromone: {
    title: 'Pheromone',
    definition: 'A chemical signal; here, represented by a concentration field on the ground.',
    model:
      'ANT has separate food and home fields. Ants deposit traces, diffusion spreads them and evaporation reduces them.',
    observe:
      'Read the colors as model concentration, not visible paint or measured biological chemistry.',
  },
  diffusion: {
    title: 'Diffusion',
    definition: 'The redistribution of signal between neighboring grid cells.',
    model:
      'Each cell exchanges concentration with four neighbors. Blocked cells and world boundaries do not let signal flow through.',
    observe: 'Diffusion spreads a trace; evaporation removes signal. They play different roles.',
  },
  emergence: {
    title: 'Emergence · self-organization',
    definition:
      'A collective pattern arising from interactions among individuals following local rules.',
    model:
      'A shared trail can form even though no ant receives a route plan and no leader coordinates the colony.',
    observe:
      'A visible pattern alone does not establish intelligence, optimality or a biological law.',
  },
  stigmergy: {
    title: 'Stigmergy',
    definition: 'Indirect coordination through changes left in a shared environment.',
    model:
      'A returning ant changes the food field; a later searching ant can respond to that trace without meeting it.',
    observe:
      'The environment carries the trace between actions. The ants do not send one another route instructions.',
  },
  feedback: {
    title: 'Positive feedback',
    definition: 'A process in which an effect can reinforce the conditions that produced it.',
    model:
      'A food trace can guide more ants to food. Their return trips can then add more trace to the corridor.',
    observe:
      'Evaporation, exploration and finite food can limit reinforcement. A stable trail is not guaranteed.',
  },
  hypothesis: {
    title: 'Hypothesis',
    definition: 'A testable prediction about how a change will affect an observation.',
    model:
      'Example: “At the same tick count, faster food-signal evaporation will produce a less persistent trail.”',
    observe:
      'Write the prediction first, change one parameter, and record results even if they contradict it. The note lasts for this page session.',
  },
  replay: {
    title: 'Run record & replay',
    definition: 'A record of the initial conditions and tick count used to compute a run again.',
    model:
      'Export saves configuration, seed, model versions and achieved ticks. Import recomputes from zero rather than loading a video.',
    observe:
      'Export pauses the simulation. Keep records before restarting a comparison; exact identity across all browser engines is not guaranteed.',
  },
  performance: {
    title: 'Actual ticks/s & worker batch',
    definition: 'Measurements of how fast your device is executing the model.',
    model:
      'Actual ticks/s is achieved progress per real second. Worker batch is the measured duration of a computation batch in milliseconds.',
    observe:
      'These describe device performance, not colony success. Speed settings target faster execution of the same model rules.',
  },
} satisfies Record<string, Term>;

export type TermId = keyof typeof enTerms;

const trTerms: Record<TermId, Term> = {
  abstraction: {
    title: 'Model soyutlaması',
    definition:
      'Seçilen mekanizmaları koruyup diğer ayrıntıları dışarıda bırakan sadeleştirilmiş temsil.',
    model:
      'ANT yerel kurallar, idealize edilmiş yön bulma ve kalibre edilmemiş birimler kullanır. Gerçek koloninin her özelliğini içermez veya belirli bir türü temsil etmez.',
    observe:
      'Sonucu bu kurallar altındaki davranışı açıklamak için kullanın. Gerçek karıncalara uyarlamak ayrı biyolojik kanıt gerektirir.',
  },
  seed: {
    title: 'Seed · rastgelelik tohumu',
    definition: 'Modelin tekrarlanabilir rastgele seçim dizisini başlatan sayı.',
    model:
      'Aynı seed, ayarlar, model sürümü ve tick sayısı aynı çalışma ortamında deneyi tekrar üretir. Tek başına seed yeterli değildir.',
    observe:
      'Parametre karşılaştırırken sabit tutun; genelleme yapmadan önce başka seed’lerle de tekrarlayın.',
  },
  tick: {
    title: 'Tick · simülasyon adımı',
    definition: 'Simülasyon dünyasının bir kez tamamen güncellenmesi.',
    model:
      'Her tick tüm karıncalar ve iki kimyasal alan güncellenir. 1× hızda hedef, gerçek saniyede 60 tick’tir.',
    observe:
      'Deneyleri eşit tick sayısında karşılaştırın. Tick, gerçek bir karıncanın yaşamındaki bir saniye değildir.',
  },
  population: {
    title: 'Popülasyon',
    definition: 'Kolonideki simüle edilmiş karınca sayısı.',
    model:
      'Tüm karıncalar aynı yerel kuralları kullanır. Sayı arttıkça daha çok karınca arama ve iz bırakma yapabilir; karıncalar birbiriyle çarpışmaz.',
    observe:
      'Daha çok besin taşınması, yalnızca daha çok toplayıcıdan kaynaklanabilir; karınca başına verimin arttığını tek başına göstermez.',
  },
  evaporation: {
    title: 'Besin izi sönümü',
    definition: 'Besin izi yoğunluğunun her tick’te kaybolan oranı.',
    model:
      '0.004, yayılımdan sonra her tick’te %0,4; 0.010 ise %1 kayıp demektir. Değişen, besin miktarı değil kimyasal izdir.',
    observe:
      'Yüksek değer, yenilenmeyen izlerin daha hızlı silinmesini sağlar. Yeni iz bırakılması yolu yine güçlendirebilir.',
  },
  exploration: {
    title: 'Keşif',
    definition: 'Arayan karıncanın yönündeki değişkenliği ayarlayan parametre.',
    model:
      'Yükseldikçe gezinme ve mevcut besin izini izlememe olasılığı artar. Sıfırda bile küçük bir gezinme bileşeni vardır.',
    observe:
      'Kapsamayı taşınan besinle birlikte okuyun: daha fazla alan gezmek, daha fazla besin getirmeyebilir.',
  },
  foodSignal: {
    title: 'Besin izi',
    definition: 'Besin taşıyarak dönen karıncaların bıraktığı kimyasal iz.',
    model:
      'Arayan karıncalar kehribar renkli bu alanın yakındaki örneklerini izleyebilir. Bırakılan miktar, besin alımından sonra kat edilen mesafeyle azalır.',
    observe:
      'Parlak bir koridor birikmiş sinyali gösterir; yolun en kısa olduğunu veya kaynakta hâlâ besin bulunduğunu kanıtlamaz.',
  },
  homeSignal: {
    title: 'Yuva izi',
    definition: 'Besin arayan karıncaların bıraktığı kimyasal iz.',
    model:
      'Adaçayı renkli alan gösterilir ve örneklenir; V0.1’de karıncaları yönlendirmez. Dönen karıncalar yuva vektörünü kullanır.',
    observe:
      'Görüntü katmanını değiştirmek, karıncaların davranışını değil sizin gördüğünüzü değiştirir.',
  },
  homeVector: {
    title: 'Yuva vektörü · yol bütünleme',
    definition:
      'Karıncanın kendi hareketinden güncellediği, yuvaya dönüş yönü ve yer değiştirme tahmini.',
    model:
      'Her hareket, içsel yuva vektöründen çıkarılır. Bu model, hesabı birikimli sapma neredeyse olmayacak şekilde idealize eder.',
    observe:
      'Dönen karınca, yuva kimyasalını takip etmeden eve yönelebilir. Engeller yine yönünü değiştirebilir.',
  },
  coverage: {
    title: 'Kapsama',
    definition: 'En az bir karıncanın girdiği geçilebilir ızgara hücrelerinin yüzdesi.',
    model:
      'Hücreler hareketten sonra ve yalnızca bir kez sayılır. Sensör menzili ve tekrar ziyaretler kapsamayı artırmaz.',
    observe:
      'Kapsama, ziyaret edilen alanı ölçer; bulunan besini, yol kalitesini veya koloninin ne kadar bildiğini ölçmez.',
  },
  discovery: {
    title: 'İlk keşif',
    definition: 'Bir karıncanın ilk kez bir birim besini aldığı tick.',
    model:
      'Besini sensör menzilinde görmek bu sayaçta keşif sayılmaz. “Henüz yok”, besin alımının gerçekleşmediğini belirtir.',
    observe: 'Keşif, teslimattan önce olur: karıncanın besini hâlâ yuvaya götürmesi gerekir.',
  },
  delivered: {
    title: 'Taşınan besin',
    definition: 'Yuvaya teslim edilen toplam besin birimi.',
    model:
      'Her başarılı dönüş bir birim ekler. Henüz taşınmakta olan besin dahil değildir. Grafik, bu birikimli sayacı son tick’ler boyunca gösterir.',
    observe:
      'Yükselen grafik teslimatları gösterir. Toplamları aynı tick sayısında ve aynı popülasyonla karşılaştırın.',
  },
  states: {
    title: 'Arayan, dönen ve durum süresi',
    definition: 'Arayan karınca besin arar; dönen karınca bir birim besinle yuvaya gider.',
    model:
      'Arayan + dönen = popülasyon. Durum süresi, son besin alımı veya teslimattan, henüz geçiş yoksa başlangıçtan beri geçen tick sayısıdır.',
    observe:
      'Çok sayıda dönen karınca yakın zamanda besin bulunduğunu gösterebilir; besinlerin yuvaya ulaştığı anlamına gelmez.',
  },
  throughput: {
    title: 'Besin / 1.000 tick · teslimat hızı',
    definition: 'Son dönemdeki teslimatların 1.000 model tick’i başına ifade edilen hızı.',
    model:
      'Son 1.000 tick’teki teslimatları sayar. Başlangıçta daha kısa olan geçen süreyi bu pencereye ölçekler.',
    observe:
      'Yakın zamandaki etkinliği okumak için kullanın. Toplam taşınan besin artarken bu hız düşebilir.',
  },
  distance: {
    title: 'Ortalama gidiş dönüş',
    definition: 'Besin teslimatıyla tamamlanan turlarda kat edilen ortalama mesafe.',
    model:
      'Gidişteki keşfi ve dönüşü kapsar. Bitmemiş turlar dahil değildir. “u”, kalibre edilmemiş model mesafe birimini belirtir.',
    observe:
      'Çizgi işareti henüz teslimat tamamlanmadığını gösterir. Bu değer, yuva ile besin arasındaki kuş uçuşu mesafe değildir.',
  },
  remaining: {
    title: 'Kalan besin',
    definition: 'Besin kaynaklarında hâlâ bulunan birim sayısı.',
    model:
      'Başlangıç besini = kalan besin + dönen karıncaların taşıdığı besin + teslim edilen besin.',
    observe:
      'Kalan besin, alım anında azalır; taşınan besin sayacı ise ancak yuvaya teslimde artar.',
  },
  probes: {
    title: 'İz algısı · sensör örnekleri',
    definition: 'Karıncanın solundan, önünden ve sağından alınan üç yakın çevre örneği.',
    model:
      'Birey paneli bu noktalardaki besin izi yoğunluğunu gösterir. Engellenen örnekler sıfır okur. Bunlar model değerleridir.',
    observe:
      'Duraklatın, bir karınca seçin ve sensörleri açın. Bir adım ilerleyerek okumaları kararıyla birlikte inceleyin.',
  },
  decision: {
    title: 'Yerel karar',
    definition: 'Karıncanın son hareketini seçerken kullandığı kural.',
    model:
      'Keşfedebilir, yakındaki besine yaklaşabilir, besin izini izleyebilir, yuva vektörünü kullanabilir veya engelden kaçınabilir. Küresel yol haritası almaz.',
    observe:
      'En güçlü örnek her zaman seçilmez: yakın hedef, engel, taşıma durumu ve keşif de kararı etkiler.',
  },
  pheromone: {
    title: 'Feromon',
    definition: 'Kimyasal bir sinyal; burada zemindeki bir yoğunluk alanıyla temsil edilir.',
    model:
      'ANT’te ayrı besin ve yuva alanları vardır. Karıncalar iz bırakır, yayılım izi dağıtır, sönüm yoğunluğu azaltır.',
    observe:
      'Renkleri görünür boya veya ölçülmüş biyolojik kimya olarak değil, model yoğunluğu olarak okuyun.',
  },
  diffusion: {
    title: 'Yayılım · difüzyon',
    definition: 'Sinyalin komşu ızgara hücreleri arasında yeniden dağılması.',
    model:
      'Her hücre dört komşusuyla yoğunluk alışverişi yapar. Engelli hücreler ve dünya sınırları sinyal akışına kapalıdır.',
    observe: 'Yayılım izi dağıtır; sönüm sinyali azaltır. Bu iki mekanizma farklı işler yapar.',
  },
  emergence: {
    title: 'Belirme · kendiliğinden örgütlenme',
    definition: 'Yerel kurallarla hareket eden bireylerin etkileşiminden ortak bir örüntü doğması.',
    model:
      'Hiçbir karıncaya yol planı verilmeden ve koloniyi yöneten bir lider olmadan ortak bir iz oluşabilir.',
    observe:
      'Görünür bir örüntü tek başına zekâyı, en iyi çözümü veya bir biyoloji yasasını kanıtlamaz.',
  },
  stigmergy: {
    title: 'Stigmerji',
    definition: 'Ortak çevrede bırakılan değişiklikler aracılığıyla dolaylı koordinasyon.',
    model:
      'Dönen karınca besin alanını değiştirir; daha sonra gelen arayan karınca, onunla karşılaşmadan bu ize tepki verebilir.',
    observe: 'İki davranış arasında izi çevre taşır. Karıncalar birbirine yol talimatı göndermez.',
  },
  feedback: {
    title: 'Pozitif geri besleme',
    definition: 'Bir sonucun, kendisini oluşturan koşulları güçlendirebildiği süreç.',
    model:
      'Besin izi daha çok karıncayı besine yönlendirebilir. Onların dönüşü de koridordaki izi artırabilir.',
    observe:
      'Sönüm, keşif ve sınırlı besin bu güçlenmeyi sınırlayabilir. Kalıcı iz garanti değildir.',
  },
  hypothesis: {
    title: 'Hipotez',
    definition: 'Bir değişikliğin gözlemi nasıl etkileyeceğine ilişkin sınanabilir tahmin.',
    model:
      'Örnek: “Eşit tick sayısında, besin izi daha hızlı sönerse daha az kalıcı bir yol göreceğim.”',
    observe:
      'Önce tahmini yazın, tek parametreyi değiştirin ve tahmininize uymasa da sonucu kaydedin. Not, bu sayfa oturumu boyunca korunur.',
  },
  replay: {
    title: 'Deney kaydı ve tekrar',
    definition:
      'Bir deneyi yeniden hesaplamak için başlangıç koşullarının ve tick sayısının kaydı.',
    model:
      'Dışa aktarım ayarları, seed’i, model sürümlerini ve ulaşılan tick’i saklar. İçe aktarım video yüklemek yerine sıfırdan hesaplar.',
    observe:
      'Dışa aktarım simülasyonu duraklatır. Yeniden başlatmadan önce kaydı alın; tüm tarayıcı motorlarında tam özdeşlik garanti değildir.',
  },
  performance: {
    title: 'Gerçek tick/sn ve Worker işlem süresi',
    definition: 'Cihazınızın modeli ne hızda çalıştırdığını gösteren ölçümler.',
    model:
      'Gerçek tick/sn, gerçek saniyede tamamlanan adım sayısıdır. Worker işlem süresi, bir hesaplama grubunun milisaniye cinsinden süresidir.',
    observe:
      'Bunlar koloni başarısını değil cihaz performansını anlatır. Hız ayarları aynı model kurallarını daha hızlı işletmeyi hedefler.',
  },
};

export const terms: Record<Language, Record<TermId, Term>> = { en: enTerms, tr: trTerms };

export const termGroups: TermId[][] = [
  ['pheromone', 'stigmergy', 'feedback', 'emergence', 'diffusion', 'homeVector', 'abstraction'],
  [
    'seed',
    'tick',
    'population',
    'evaporation',
    'exploration',
    'foodSignal',
    'homeSignal',
    'hypothesis',
    'replay',
  ],
  [
    'delivered',
    'states',
    'coverage',
    'discovery',
    'throughput',
    'distance',
    'remaining',
    'probes',
    'decision',
    'performance',
  ],
];

interface Lesson {
  title: string;
  goal: string;
  steps: { title: string; body: string }[];
  question: string;
  answer: string;
  target: string;
  action: string;
  terms: TermId[];
}

interface LearningCopy {
  nav: string;
  eyebrow: string;
  title: string;
  intro: string;
  hint: string;
  explain: string;
  inModel: string;
  howToRead: string;
  close: string;
  lessonLabel: string;
  questionLabel: string;
  reveal: string;
  glossary: string;
  glossaryIntro: string;
  groups: string[];
  sources: string;
  sourceNote: string;
  lessons: Lesson[];
}

export const learningCopy: Record<Language, LearningCopy> = {
  en: {
    nav: 'Learning guide',
    eyebrow: 'LEARN BY OBSERVING · EXP–001',
    title: 'From a local decision to a shared trail.',
    intro:
      'Build an explanation, one observation at a time. Choose a short exercise, make a prediction and test it in the world above.',
    hint: 'Use the ⓘ buttons beside terms for a definition and a reading tip.',
    explain: 'Explain term',
    inModel: 'In this model',
    howToRead: 'How to read it',
    close: 'Close explanation',
    lessonLabel: 'Choose a learning exercise',
    questionLabel: 'Check your understanding',
    reveal: 'Reveal the explanation',
    glossary: 'Term glossary',
    glossaryIntro:
      'Choose a term to see its meaning, how ANT models it and what you can infer from it.',
    groups: ['Mechanisms', 'Experiment & controls', 'Observations & measurements'],
    sources: 'Research context',
    sourceNote:
      'Trail laying and following motivate the local-to-collective question. These exercises describe ANT’s rules; they do not reproduce or validate a biological experiment.',
    lessons: [
      {
        title: 'Read the first trail',
        goal: 'Distinguish finding food, carrying it and reinforcing a path.',
        steps: [
          {
            title: 'Predict',
            body: 'Before running, decide which should appear first: a food discovery, a food trace or a nest delivery.',
          },
          {
            title: 'Observe',
            body: 'Select Food signal and run. Watch First discovery, then Returning and Food delivered. At 20× you can reach later stages sooner.',
          },
          {
            title: 'Connect',
            body: 'When a returning ant leaves a trace, other searching ants can respond. Further successful returns can reinforce the corridor.',
          },
          {
            title: 'Interpret',
            body: 'Compare the bright trace with the delivery plot. If no stable trail appears, record that observation too; one is not guaranteed for every run.',
          },
        ],
        question: 'Does a brighter food trace prove that the colony found the shortest route?',
        answer:
          'No. Brightness represents accumulated chemical signal. It does not measure route optimality. You would need a separate path-length comparison to make that claim.',
        target: '#world',
        action: 'Observe the world',
        terms: ['foodSignal', 'feedback', 'emergence'],
      },
      {
        title: 'Change one parameter',
        goal: 'Test what happens when the colony’s chemical trace fades faster.',
        steps: [
          {
            title: 'Predict',
            body: 'Write a hypothesis in the experiment panel: how might faster food-signal evaporation change the trail and deliveries?',
          },
          {
            title: 'Set a baseline',
            body: 'Keep the seed fixed. Set population to 100, exploration to 0.18 and food evaporation to 0.004. Apply, then Reset to pause at tick 0. In Run & record, run 6,000 ticks and export.',
          },
          {
            title: 'Change & repeat',
            body: 'Change only food evaporation to 0.010. Apply, Reset to tick 0, and run exactly 6,000 ticks again. Record coverage and deliveries; compare with your saved baseline.',
          },
          {
            title: 'Interpret',
            body: 'Did the result support the prediction? Keep all other settings fixed, including any imported world. Repeat the pair with more seeds before drawing a broader conclusion.',
          },
        ],
        question:
          'Why compare at equal tick counts instead of after the same number of real seconds?',
        answer:
          'Ticks measure completed model updates. Your device and speed setting change how quickly they execute. Equal tick budgets give both runs the same simulated opportunity; elapsed real time may not.',
        target: '#parameters',
        action: 'Go to parameters',
        terms: ['hypothesis', 'evaporation', 'seed', 'tick'],
      },
      {
        title: 'Follow one ant',
        goal: 'Explain an individual decision using only the information that ant has.',
        steps: [
          {
            title: 'Select',
            body: 'Pause the world. Click an ant or use Select ant in the Individual panel. Turn on Show sensors and Follow ant.',
          },
          {
            title: 'Inspect',
            body: 'Read its carrying state, local decision and three food-signal samples: left, ahead and right. The values describe nearby conditions.',
          },
          {
            title: 'Step',
            body: 'Advance one tick at a time. Compare changes in the readings and decision. An obstacle, nearby food or the carrying state can change which rule takes priority.',
          },
          {
            title: 'Explain',
            body: 'Find a returning ant and read its home-vector rule. Switching to Home signal reveals the trace, but that chemical does not steer ants in V0.1.',
          },
        ],
        question: 'Must an ant always turn toward the largest of the three signal readings?',
        answer:
          'No. Nearby targets and obstacles also matter. Returning ants use their integrated home vector, and searching ants can explore instead of following a trace. The probes are part of a local decision, not a complete route plan.',
        target: '#individual',
        action: 'Inspect an ant',
        terms: ['probes', 'decision', 'homeVector', 'stigmergy'],
      },
    ],
  },
  tr: {
    nav: 'Öğrenme rehberi',
    eyebrow: 'GÖZLEMLEYEREK ÖĞREN · EXP–001',
    title: 'Yerel karardan ortak bir ize.',
    intro:
      'Her gözlemle açıklamanızı geliştirin. Kısa bir çalışma seçin, tahminde bulunun ve yukarıdaki dünyada sınayın.',
    hint: 'Tanım ve yorumlama ipucu için terimlerin yanındaki ⓘ düğmelerini kullanın.',
    explain: 'Terimi açıkla',
    inModel: 'Bu modelde',
    howToRead: 'Nasıl yorumlanır?',
    close: 'Açıklamayı kapat',
    lessonLabel: 'Öğrenme çalışması seçin',
    questionLabel: 'Anladığınızı sınayın',
    reveal: 'Açıklamayı göster',
    glossary: 'Terim sözlüğü',
    glossaryIntro:
      'Anlamını, ANT’teki karşılığını ve nasıl yorumlanacağını görmek için bir terim seçin.',
    groups: ['Mekanizmalar', 'Deney ve kontroller', 'Gözlemler ve ölçümler'],
    sources: 'Araştırma bağlamı',
    sourceNote:
      'İz bırakma ve iz takip etme, bireyden ortak davranışa geçiş sorusuna temel oluşturur. Bu çalışmalar ANT’in kurallarını açıklar; biyolojik bir deneyi yeniden üretmez veya doğrulamaz.',
    lessons: [
      {
        title: 'İlk izi okuyun',
        goal: 'Besin bulmayı, taşımayı ve bir yolu güçlendirmeyi birbirinden ayırın.',
        steps: [
          {
            title: 'Tahmin edin',
            body: 'Çalıştırmadan önce düşünün: ilk keşif, besin izi ve yuvaya teslimattan hangisi önce görünmeli?',
          },
          {
            title: 'Gözlemleyin',
            body: 'Besin izi katmanını seçip çalıştırın. İlk keşfi, ardından Dönen ve Taşınan besin sayaçlarını izleyin. 20× hızla sonraki aşamalara daha çabuk ulaşabilirsiniz.',
          },
          {
            title: 'İlişki kurun',
            body: 'Dönen karınca iz bıraktığında diğer arayan karıncalar buna tepki verebilir. Sonraki başarılı dönüşler koridoru güçlendirebilir.',
          },
          {
            title: 'Yorumlayın',
            body: 'Parlak izi teslimat grafiğiyle birlikte okuyun. Kalıcı yol oluşmazsa bunu da kaydedin; her deneyde oluşması garanti değildir.',
          },
        ],
        question: 'Daha parlak besin izi, koloninin en kısa yolu bulduğunu kanıtlar mı?',
        answer:
          'Hayır. Parlaklık biriken kimyasal sinyali gösterir; yolun en iyi çözüm olduğunu ölçmez. Böyle bir iddia için ayrıca yol uzunluklarını karşılaştırmak gerekir.',
        target: '#world',
        action: 'Dünyayı gözlemle',
        terms: ['foodSignal', 'feedback', 'emergence'],
      },
      {
        title: 'Tek parametreyi değiştirin',
        goal: 'Koloninin kimyasal izi daha hızlı silinirse ne olduğunu sınayın.',
        steps: [
          {
            title: 'Tahmin edin',
            body: 'Deney paneline bir hipotez yazın: besin izinin daha hızlı sönmesi yolu ve teslimatları nasıl etkileyebilir?',
          },
          {
            title: 'Başlangıcı kaydedin',
            body: 'Seed’i sabit tutun. Popülasyonu 100, keşfi 0.18, besin izi sönümünü 0.004 yapın. Uygulayın, ardından Sıfırla ile tick 0’da durun. Çalıştır ve kaydet’te 6.000 tick çalıştırıp dışa aktarın.',
          },
          {
            title: 'Değiştirip tekrarlayın',
            body: 'Yalnızca besin izi sönümünü 0.010 yapın. Uygulayın, tick 0’a sıfırlayın ve yine tam 6.000 tick çalıştırın. Kapsamayı ve teslimatları kaydedip ilk deneyle karşılaştırın.',
          },
          {
            title: 'Yorumlayın',
            body: 'Sonuç tahmini destekledi mi? İçe aktarılan dünya dahil diğer tüm ayarları sabit tutun. Daha geniş bir sonuca varmadan önce bu ikili deneyi başka seed’lerle tekrarlayın.',
          },
        ],
        question: 'Neden aynı gerçek süre sonunda değil, eşit tick sayısında karşılaştırıyoruz?',
        answer:
          'Tick, tamamlanan model adımıdır. Cihazınız ve hız ayarı bu adımların ne kadar hızlı işlendiğini değiştirir. Eşit tick bütçesi iki deneye aynı simülasyon süresini verir; eşit gerçek süre bunu sağlamayabilir.',
        target: '#parameters',
        action: 'Parametrelere git',
        terms: ['hypothesis', 'evaporation', 'seed', 'tick'],
      },
      {
        title: 'Bir karıncayı izleyin',
        goal: 'Bireysel bir kararı yalnızca karıncanın elindeki bilgiyle açıklayın.',
        steps: [
          {
            title: 'Seçin',
            body: 'Dünyayı duraklatın. Bir karıncaya tıklayın veya Birey panelindeki Karınca seç alanını kullanın. Sensörleri göster ve Karıncayı izle seçeneklerini açın.',
          },
          {
            title: 'İnceleyin',
            body: 'Besin taşıma durumunu, yerel kararını ve üç besin izi örneğini okuyun: sol, ön ve sağ. Değerler yakın çevredeki koşulları anlatır.',
          },
          {
            title: 'Adımlayın',
            body: 'Birer tick ilerleyin. Okumaların ve kararın değişimini karşılaştırın. Engel, yakındaki besin veya taşıma durumu hangi kuralın öncelik aldığını değiştirebilir.',
          },
          {
            title: 'Açıklayın',
            body: 'Dönen bir karınca bulup yuva vektörü kuralını inceleyin. Yuva izi katmanı izi görünür yapar; bu kimyasal V0.1’de karıncaları yönlendirmez.',
          },
        ],
        question: 'Karınca her zaman üç örnekten en yüksek olanına mı yönelmelidir?',
        answer:
          'Hayır. Yakın hedef ve engeller de etkilidir. Dönen karınca kendi yuva vektörünü kullanır; arayan karınca ise izi izlemek yerine keşfedebilir. Örnekler yerel kararın parçasıdır, tam bir yol planı değildir.',
        target: '#individual',
        action: 'Bir karıncayı incele',
        terms: ['probes', 'decision', 'homeVector', 'stigmergy'],
      },
    ],
  },
};
