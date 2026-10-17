// Dataset Terjemahan Bahasa Indonesia Kitab Maulid (Barzanji, Simtud Duror, Dliyaul Lami', Ad-Diba'i, Burdah)

export interface VerseTranslation {
  ar: string;
  id: string;
}

// 1. Terjemahan Frasa & Ayat Umum
export const COMMON_TRANSLATIONS: Record<string, string> = {
  "اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ": "Ya Allah, limpahkanlah rahmat, keselamatan, dan keberkahan kepada-Nya.",
  "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ": "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
  "لَقَدْ جَاءَكُمْ رَسُولٌ مِنْ أَنْفُسِكُمْ عَزِيزٌ عَلَيْهِ مَا عَنِتُّمْ حَرِيصٌ عَلَيْكُمْ بِالْمُؤْمِنِينَ رَءُوفٌ رَحِيمٌ ۝":
    "Sungguh, benar-benar telah datang kepadamu seorang rasul dari kaummu sendiri. Berat terasa olehnya penderitaan yang kamu alami, sangat menginginkan (keimanan dan keselamatan) bagimu, dan (bersikap) penyantun dan penyayang terhadap orang-orang mukmin.",
  "إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ۝":
    "Sesungguhnya Allah dan para malaikat-Nya berselawat kepada Nabi. Wahai orang-orang yang beriman, berselawatlah kamu untuk Nabi dan ucapkanlah salam penghormatan kepadanya.",
  "عَطِّرِ اللَّهُمَّ قَبْرَهُ الْكَرِيمَ بِعَرْفٍ شَذِيٍّ مِنْ صَلَاةٍ وَتَسْلِيمٍ ❁ اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ ❁":
    "Ya Allah, harumkanlah kuburnya yang mulia dengan keharuman semerbak sholawat dan salam. Ya Allah, limpahkanlah sholawat, salam, dan keberkahan kepada beliau."
};

// 2. Terjemahan Per Bab Maulid Al-Barzanji
export const BARZANJI_RAWIS_TRANSLATIONS: Record<number, string[]> = {
  // Bab 0: Yā Robbi Sholli
  0: [
    "Ya Allah limpahkanlah sholawat atas Nabi Muhammad ﷺ, Ya Allah limpahkanlah sholawat dan keselamatan atas beliau.",
    "Ya Allah sampaikanlah beliau ke maqam wasilah, Ya Allah khususkanlah beliau dengan segala keutamaan.",
    "Ya Allah ridhailah para sahabat beliau, Ya Allah ridhailah segenap keturunan beliau.",
    "Ya Allah ridhailah para guru kami, Ya Allah rahmatilah kedua orang tua kami.",
    "Ya Allah rahmatilah kami semua, Ya Allah rahmatilah seluruh kaum muslimin.",
    "Ya Allah ampunilah setiap pendosa, Ya Allah jangan putuskan harapan kami.",
    "Ya Allah wahai Dzat Yang Maha Mendengar doa kami, Ya Allah sampaikanlah kami untuk dapat berziarah kepada beliau.",
    "Ya Allah liputlah kami dengan cahaya beliau, Ya Allah anugerahkanlah penjagaan dan keamanan-Mu.",
    "Ya Allah tempatkanlah kami di dalam surga-Mu, Ya Allah selamatkanlah kami dari siksa-Mu.",
    "Ya Allah karuniakanlah mati syahid kepada kami, Ya Allah sertakanlah kami dengan kebahagiaan.",
    "Ya Allah perbaikilah setiap orang yang berbuat kebajikan, Ya Allah cukupkanlah kami dari segala kejahatan yang menyakiti.",
    "Ya Allah sudilah kiranya menutup umur kami dengan mendapat syafaat Nabi pilihan ﷺ, Ya Allah limpahkanlah sholawat dan salam atas beliau."
  ],
  // Bab 1: Laqod Jāakum (Muqaddimah)
  1: [
    "Ya Allah, limpahkanlah rahmat, keselamatan, dan keberkahan kepada-Nya.",
    "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.",
    "Sungguh, benar-benar telah datang kepadamu seorang rasul dari kaummu sendiri. Berat terasa olehnya penderitaan yang kamu alami, sangat menginginkan (keimanan dan keselamatan) bagimu, dan (bersikap) penyantun dan penyayang terhadap orang-orang mukmin.",
    "Sesungguhnya Allah dan para malaikat-Nya berselawat kepada Nabi. Wahai orang-orang yang beriman, berselawatlah kamu untuk Nabi dan ucapkanlah salam penghormatan kepadanya."
  ],
  // Bab 2: Abtadiul Imlāa (Fasal 1: Pembukaan)
  2: [
    "Aku memulai menulis riwayat maulid ini dengan menyebut asma Dzat Yang Maha Tinggi, seraya memohon curahan limpahan berkah atas apa yang telah dianugerahkan dan diberikan-Nya.",
    "Dan aku memuji dengan pujian yang sumbernya segar nan menyenangkan, seraya mengendarai rasa syukur yang indah.",
    "Dan aku bersholawat serta bersalam atas cahaya yang disifati dengan kedahulan dan keawalan, yang berpindah-pindah pada dahi-dahi para leluhur yang mulia.",
    "Dan aku memohon kepada Allah keridhaan yang khusus bagi keluarga suci kenabian, dan merata bagi segenap sahabat, pengikut, dan siapa saja yang mencintainya.",
    "Dan aku memohon petunjuk-Nya untuk menempuh jalan-jalan yang terang dan jelas, serta penjagaan dari kesesatan di setiap langkah dan kekeliruan.",
    "Dan aku bentangkan dari kisah maulid Nabi yang mulia sehelai selendang tenun yang indah mempesona, seraya merangkai nasab yang mulia laksana untaian permata yang menghiasi pendengaran dengan keindahannya.",
    "Dan aku memohon pertolongan dengan daya dan kekuatan Allah Ta'ala yang Maha Kuat, karena sesungguhnya tiada daya dan upaya melainkan dengan pertolongan Allah."
  ],
  // Bab 3: Waba'du Faaqūlu (Fasal 2: Nasab Nabi ﷺ)
  3: [
    "Maka setelah itu kukatakan: Beliau adalah junjungan kita Muhammad ﷺ putra Abdullah putra Abdul Muthalib (namanya Syaibatul Hamd, karena terpuji pekertinya yang luhur), putra Hasyim (namanya Amr), putra Abdu Manaf (namanya Al-Mughirah yang memiliki derajat keluhuran tinggi).",
    "Putra Qushay (namanya Mujammi', dinamai Qushay karena jauh tinggalnya di negeri Qudha'ah yang terpencil, hingga Allah mengembalikannya ke tanah haram lalu ia menjaganya), putra Kilab (namanya Hakim), putra Murrah, putra Ka'ab, putra Lu'ay, putra Ghalib, putra Fihr (namanya Quraisy, dan kepadanya kabilah Quraisy dinisbatkan).",
    "Dan silsilah di atasnya dinisbatkan kepada Kinanah sebagaimana pendapat banyak ulama, putra Malik, putra An-Nadhir, putra Kinanah, putra Khuzaimah, putra Mudrikah, putra Ilyas (dialah yang pertama mempersembahkan unta ke tanah haram, dan terdengar dari sulbinya suara Nabi ﷺ berdzikir dan bertalbiyah).",
    "Putra Mudhar, putra Nizar, putra Ma'ad, putra Adnan. Inilah untaian mutiara yang dirangkai jemari sunnah yang agung. Dan menyambung nasabnya kepada Nabi Ibrahim Al-Khalil ditahan oleh syara', namun Adnan tanpa keraguan menurut para pakar nasab bernasab kepada Nabi Ismail sang sembelihan.",
    "Alangkah agungnya untaian mutiara nasab ini yang bertabur bintang kejora, bagaimana tidak, sedangkan junjungan yang mulia Nabi Muhammad ﷺ adalah permata intan terpilih di tengah-tengahnya.",
    "Alangkah mulianya nasab yang disucikan Allah Ta'ala dari noda jahiliyah. Para pemuka suci yang cahaya kenabian memancar di dahi-dahi mereka yang elok, hingga purnama cahayanya bersinar terang di kening kakeknya Abdul Muthalib dan putranya Abdullah."
  ],
  // Bab 4: Walammā Arādallāh (Fasal 3: Peristiwa Menjelang Kelahiran)
  4: [
    "Tatkala Allah Ta'ala berkehendak menampakkan hakikat Muhammad ﷺ, dan memunculkannya berupa jasad dan ruh dengan bentuk dan maknanya,",
    "Allah memindahkannya ke tempat persemayamannya di dalam mutiara rahim Sayyidah Aminah Az-Zuhriyyah, dan Dzat Yang Maha Dekat lagi Maha Mengabulkan doa mengkhususkannya menjadi ibunda bagi hamba pilihan-Nya.",
    "Maka diserukan di langit dan bumi bahwa Aminah telah mengandung cahaya Dzat-Nya, dan berhembuslah angin kerinduan bagi setiap yang rindu,",
    "Bumi pun berhias dengan hamparan tanaman hijau setelah sekian lama gersang, buah-buahan ranum dan pepohonan merendahkan dahannya bagi pemetiknya, hewan-hewan tunggangan berbicara fasih dengan bahasa Arab mengabarkan kehamilannya, dan singgasana raja-raja serta berhala-berhala jatuh tersungkur pada wajah dan mulutnya.",
    "Hewan-hewan liar di barat dan timur saling mengabarkan berita gembira bersama hewan-hewan lautan, seluruh alam mereguk piala kegembiraan, dan kaum jin diberitahu bahwa masa kenabian telah membayang,",
    "Dan ibunda beliau didatangi dalam mimpi seraya dikatakan kepadanya: 'Sesungguhnya engkau telah mengandung penghulu seluruh alam dan sebaik-baik manusia, maka bila engkau melahirkannya namailah ia Muhammad, karena kelak ia akan terpuji kesudahannya'."
  ],
  // Bab 5: Walammā Tamma Min Hamlih (Fasal 4: Kelahiran Nabi ﷺ)
  5: [
    "Ketika genap masa kandungannya dua bulan menurut pendapat yang masyhur, wafatlah ayahnya, Abdullah, di Madinah Munawwarah,",
    "Dan ketika genap kandungannya sembilan bulan qamariyyah, tibalah saatnya masa kegelapan tersingkap terang benderang.",
    "Pada malam kelahirannya, hadir menemani ibundanya Sayyidah Asiyah dan Sayyidah Maryam bersama para bidadari surga yang suci.",
    "Maka rasa sakit persalinan membimbingnya, lalu Sayyidah Aminah melahirkan beliau ﷺ sebagai cahaya yang berkilauan sinarnya menembus cakrawala semesta."
  ],
  // Mahalul Qiyam
  6: [
    "Wahai Nabi, salam sejahtera untukmu. Wahai Rasul, salam sejahtera untukmu. Wahai kekasih, salam sejahtera untukmu. Sholawat Allah tercurah atasmu.",
    "Telah terbit purnama di atas kita, maka tenggelamlah segala purnama. Belum pernah kami melihat keindahan sepertimu, wahai wajah sumber segala kegembiraan.",
    "Engkau laksana matahari, engkau laksana purnama, engkau adalah cahaya di atas cahaya. Engkau laksana intan permata nan mahal, engkaulah lentera penerang dada.",
    "Wahai kekasihku, wahai Muhammad, wahai pengantin belahan bumi barat dan timur. Wahai insan yang dikokohkan, wahai yang dimuliakan, wahai imam dua kiblat.",
    "Barangsiapa memandang wajahmu niscaya berbahagia, wahai insan yang berkedudukan mulia dari kedua orang tua yang mulia."
  ],
  // Bab 6: Wabaraza ﷺ (Fasal 5: Nabi yang Baru Lahir)
  7: [
    "Maka lahirlah beliau ﷺ seraya meletakkan kedua tangannya di atas bumi, dengan mengangkat kepalanya ke arah langit yang tinggi,",
    "Mengisyaratkan dengan angkatan kepala itu akan keluhuran dan kemuliaan derajatnya atas segenap makhluk ciptaan Allah.",
    "Ibunda beliau memanggil kakeknya Abdul Muthalib yang sedang thawaf di Ka'bah, maka ia pun datang bergegas memandangnya dengan rasa bahagia yang tiada tara,",
    "Lalu dibawanya sang bayi ke dalam Ka'bah yang agung seraya berdoa dengan niat yang tulus dan bersyukur kepada Allah atas karunia agung yang diberikan kepadanya.",
    "Dan beliau dilahirkan dalam keadaan bersih, terkhitan, terputus tali pusarnya oleh tangan kekuasaan Ilahi, semerbak harum dengan kedua mata bercelak celak pemeliharaan Allah."
  ],
  // Bab 7: Wa Zhahara 'Inda Wilādatih (Fasal 6: Tanda & Mukjizat Kelahiran)
  8: [
    "Tampaklah saat kelahirannya ﷺ berbagai keajaiban dan perkara gaib yang luar biasa sebagai tanda pendahuluan bagi kenabiannya,",
    "Langit ditambah penjagaannya dari godaan setan, bintang-bintang cemerlang melempari jin durhaka yang mencuri dengar,",
    "Bintang-bintang zuhrah merendah menyinari lembah dan bukit tanah haram, dan memancarlah bersama beliau cahaya yang menerangi istana-istana kaisar di negeri Syam hingga dapat dilihat oleh penduduk Makkah.",
    "Runtuhlah empat belas balkon istana Kisra Anusyirwan di Madain, padamlah api sesembahan bangsa Persia yang menyala selama seribu tahun,",
    "Keringlah danau Sawa yang terletak antara Hamadzan dan Qum, dan mengalirlah air di lembah Samawah yang sebelumnya gersang kering kerontang."
  ],
  // Bab 8: Wa Ardha'athu (Fasal 7: Masa Menyusu)
  9: [
    "Ibunda beliau menyusuinya selama beberapa hari, kemudian beliau disusui oleh Tsuwaibah Al-Aslamiyyah, budak wanita yang dimerdekakan oleh Abu Lahab ketika mengabarkan kelahiran beliau,",
    "Kemudian beliau disusui oleh wanita bani Sa'ad, Halimah As-Sa'diyyah, yang sebelumnya ditolak oleh para ibu susu karena kemiskinannya,",
    "Maka seketika berubahlah kehidupannya menjadi penuh berkah dan kesuburan, kedua payudaranya memancarkan air susu yang berlimpah ruah, dan ternaknya menjadi gemuk penuh berkah."
  ]
};

// 3. Fallback cerdas untuk menerjemahkan paragraf Arab
export function getMaulidTextTranslation(
  arText: string,
  bookId: string,
  chapterIndex: number,
  itemIndex: number
): string | null {
  if (!arText) return null;
  const trimmed = arText.trim();

  // 1. Cek terjemahan frasa umum
  if (COMMON_TRANSLATIONS[trimmed]) {
    return COMMON_TRANSLATIONS[trimmed];
  }

  // Cek jika teks mengandung Bismillah
  if (trimmed.includes("بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ") || trimmed === "بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيمِ") {
    return "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.";
  }

  // Cek jika teks adalah sholawat pembuka
  if (trimmed.includes("اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ")) {
    return "Ya Allah, limpahkanlah rahmat, keselamatan, dan keberkahan kepada-Nya.";
  }

  // Cek jika teks adalah ayat Laqod Ja'akum
  if (trimmed.includes("لَقَدْ جَاءَكُمْ رَسُولٌ")) {
    return "Sungguh, benar-benar telah datang kepadamu seorang rasul dari kaummu sendiri. Berat terasa olehnya penderitaan yang kamu alami, sangat menginginkan (keimanan dan keselamatan) bagimu, dan (bersikap) penyantun dan penyayang terhadap orang-orang mukmin.";
  }

  // Cek jika teks adalah ayat Innallaha wa malaikatahu
  if (trimmed.includes("إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ")) {
    return "Sesungguhnya Allah dan para malaikat-Nya berselawat kepada Nabi. Wahai orang-orang yang beriman, berselawatlah kamu untuk Nabi dan ucapkanlah salam penghormatan kepadanya.";
  }

  // Cek jika teks adalah sholawat refrain Barzanji
  if (trimmed.includes("عَطِّرِ اللَّهُمَّ قَبْرَهُ الْكَرِيمَ")) {
    return "Ya Allah, harumkanlah kuburnya yang mulia dengan keharuman semerbak sholawat dan salam. Ya Allah, limpahkanlah sholawat, salam, dan keberkahan kepada beliau.";
  }

  // 2. Cek dataset terjemahan Barzanji per bab
  if (bookId === 'b') {
    const list = BARZANJI_RAWIS_TRANSLATIONS[chapterIndex];
    if (list && list[itemIndex]) {
      return list[itemIndex];
    }
  }

  return null;
}
