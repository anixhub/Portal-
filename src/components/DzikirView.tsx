import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Play,
  Square,
  Share2,
  Copy,
  RotateCcw,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { useBackHandler } from '../utils/navigationHistory';

interface DzikirItem {
  t: string;      // Title
  ar: string;     // Arabic text
  la: string;     // Latin transliteration
  id: string;     // Indonesian translation
  n: number;      // Target count
}

interface DzikirCollection {
  id: string;
  title: string;
  items: DzikirItem[];
}

interface DzikirCategory {
  id: string;
  name: string;
  color: string;
  art: 'sit' | 'dua' | 'read' | 'books';
  cols: DzikirCollection[];
}

interface DzikirViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategoryId?: string;
}

/* ================= DATA BACAAN DZIKIR ================= */
const FATIHAH: DzikirItem = {
  t: 'Surat Al-Fatihah',
  ar: 'بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ [١] اَلْحَمْدُ لِلّٰهِ رَبِّ الْعٰلَمِيْنَۙ [٢] الرَّحْمٰنِ الرَّحِيْمِۙ [٣] مٰلِكِ يَوْمِ الدِّيْنِۗ [٤] اِيَّاكَ نَعْبُدُ وَاِيَّاكَ نَسْتَعِيْنَۗ [٥] اِهْدِنَا الصِّرَاطَ الْمُسْتَقِيْمَۙ [٦] صِرَاطَ الَّذِيْنَ اَنْعَمْتَ عَلَيْهِمْ ەۙ غَيْرِ الْمَغْضُوْبِ عَلَيْهِمْ وَلَا الضَّاۤلِّيْنَ [٧]',
  la: "(1) bismillahir rahmanir rahim. (2) al hamdu lillahi rabbil 'alamin. (3) ar rahmanir rahim. (4) maliki yaumid din. (5) iyyaka na'budu wa iyyaka nasta'in. (6) ihdinash shirathal mustaqim. (7) shirathal ladzina an'amta 'alaihim, ghairil maghdhubi 'alaihim wa ladh dhallin.",
  id: '(1) Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang. (2) Segala puji bagi Allah, Tuhan semesta alam. (3) Yang Maha Pengasih lagi Maha Penyayang. (4) Pemilik hari Pembalasan. (5) Hanya kepada Engkaulah kami menyembah dan hanya kepada Engkaulah kami memohon pertolongan. (6) Bimbinglah kami ke jalan yang lurus, (7) (yaitu) jalan orang-orang yang telah Engkau beri nikmat, bukan (jalan) mereka yang dimurkai dan bukan (pula jalan) orang-orang yang sesat.',
  n: 1
};

const KURSI: DzikirItem = {
  t: 'Ayat Kursi (QS. Al-Baqarah: 255)',
  ar: 'اَللّٰهُ لَآ اِلٰهَ اِلَّا هُوَۚ اَلْحَيُّ الْقَيُّوْمُ ەۚ لَا تَأْخُذُهٗ سِنَةٌ وَّلَا نَوْمٌ ۗ لَهٗ مَا فِى السَّمٰوٰتِ وَمَا فِى الْاَرْضِۗ مَنْ ذَا الَّذِيْ يَشْفَعُ عِنْدَهٗٓ اِلَّا بِاِذْنِهٖۗ يَعْلَمُ مَا بَيْنَ اَيْدِيْهِمْ وَمَا خَلْفَهُمْۚ وَلَا يُحِيْطُوْنَ بِشَيْءٍ مِّنْ عِلْمِهٖٓ اِلَّا بِمَا شَاۤءَۚ وَسِعَ كُرْسِيُّهُ السَّمٰوٰتِ وَالْاَرْضَۚ وَلَا يَـُٔوْدُهٗ حِفْظُهُمَاۚ وَهُوَ الْعَلِيُّ الْعَظِيْمُ [٢٥٥]',
  la: "Allahu la ilaha illa huwal hayyul qayyum, la ta'khudzuhu sinatuw wa la naum, lahu ma fis samawati wa ma fil ardh, man dzal ladzi yasyfa'u 'indahu illa bi idznih, ya'lamu ma baina aidihim wa ma khalfahum, wa la yuhithuna bi syai'im min 'ilmihi illa bima syaa', wasi'a kursiyyuhus samawati wal ardh, wa la ya'uduhu hifzhuhuma, wa huwal 'aliyyul 'azhim.",
  id: 'Allah, tidak ada tuhan selain Dia, Yang Mahahidup, Yang terus-menerus mengurus (makhluk-Nya). Dia tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan di bumi. Tidak ada yang dapat memberi syafaat di sisi-Nya tanpa izin-Nya. Dia mengetahui apa yang di hadapan mereka dan apa yang di belakang mereka, dan mereka tidak mengetahui sesuatu apa pun dari ilmu-Nya kecuali apa yang Dia kehendaki. Kursi-Nya meliputi langit dan bumi, dan Dia tidak merasa berat memelihara keduanya. Dan Dia Mahatinggi, Mahabesar.',
  n: 1
};

const IKHLAS: DzikirItem = {
  t: 'Surat Al-Ikhlas',
  ar: 'قُلْ هُوَ اللّٰهُ اَحَدٌۚ [١] اَللّٰهُ الصَّمَدُۚ [٢] لَمْ يَلِدْ ەۙ وَلَمْ يُوْلَدْۙ [٣] وَلَمْ يَكُنْ لَّهٗ كُفُوًا اَحَدٌ [٤]',
  la: '(1) qul huwallahu ahad. (2) allahush shamad. (3) lam yalid wa lam yulad. (4) wa lam yakul lahu kufuwan ahad.',
  id: 'Katakanlah (Muhammad), "Dialah Allah, Yang Maha Esa. (2) Allah tempat meminta segala sesuatu. (3) (Dia) tidak beranak dan tidak pula diperanakkan. (4) Dan tidak ada sesuatu yang setara dengan Dia."',
  n: 3
};

const FALAQ: DzikirItem = {
  t: 'Surat Al-Falaq',
  ar: 'قُلْ اَعُوْذُ بِرَبِّ الْفَلَقِۙ [١] مِنْ شَرِّ مَا خَلَقَۙ [٢] وَمِنْ شَرِّ غَاسِقٍ اِذَا وَقَبَۙ [٣] وَمِنْ شَرِّ النَّفّٰثٰتِ فِى الْعُقَدِۙ [٤] وَمِنْ شَرِّ حَاسِدٍ اِذَا حَسَدَ [٥]',
  la: "(1) qul a'udzu birabbil falaq. (2) min syarri ma khalaq. (3) wa min syarri ghasiqin idza waqab. (4) wa min syarrin naffatsati fil 'uqad. (5) wa min syarri hasidin idza hasad.",
  id: 'Katakanlah, "Aku berlindung kepada Tuhan yang menguasai subuh (fajar), (2) dari kejahatan (makhluk yang) Dia ciptakan, (3) dan dari kejahatan malam apabila telah gelap gulita, (4) dan dari kejahatan perempuan-perempuan penyihir yang meniup pada buhul-buhul (talinya), (5) dan dari kejahatan orang yang dengki apabila dia dengki."',
  n: 3
};

const NAS: DzikirItem = {
  t: 'Surat An-Nas',
  ar: 'قُلْ اَعُوْذُ بِرَبِّ النَّاسِۙ [١] مَلِكِ النَّاسِۙ [٢] اِلٰهِ النَّاسِۙ [٣] مِنْ شَرِّ الْوَسْوَاسِ ەۙ الْخَنَّاسِۖ [٤] الَّذِيْ يُوَسْوِسُ فِيْ صُدُوْرِ النَّاسِۙ [٥] مِنَ الْجِنَّةِ وَالنَّاسِ [٦]',
  la: "(1) qul a'udzu birabbin nas. (2) malikin nas. (3) ilahin nas. (4) min syarril waswasil khannas. (5) alladzi yuwaswisu fi shudurin nas. (6) minal jinnati wan nas.",
  id: 'Katakanlah, "Aku berlindung kepada Tuhannya manusia, (2) Raja manusia, (3) sembahan manusia, (4) dari kejahatan (bisikan) setan yang bersembunyi, (5) yang membisikkan (kejahatan) ke dalam dada manusia, (6) dari (golongan) jin dan manusia."',
  n: 3
};

const NURANIYAH: DzikirItem = {
  t: 'Shalawat Nuraniyah (Badawi Qubra)',
  ar: 'اَللّٰهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلٰى سَيِّدِنَا وَمَوْلَانَا مُحَمَّدٍ شَجَرَةِ الْأَصْلِ النُّورَانِيَّةِ وَلَمْعَةِ الْقَبْضَةِ الرَّحْمَانِيَّةِ وَأَفْضَلِ الْخَلِيقَةِ الْإِنْسَانِيَّةِ وَأَشْرَفِ الصُّورَةِ الْجِسْمَانِيَّةِ وَمَعْدِنِ الْأَسْرَارِ الرَّبَّانِيَّةِ وَخَزَائِنِ الْعُلُومِ الْاِصْطِفَائِيَّةِ صَاحِبِ الْقَبْضَةِ الْأَصْلِيَّةِ وَالْبَهْجَةِ السَّنِيَّةِ وَالرُّتْبَةِ الْعَلِيَّةِ مَنِ انْدَرَجَتِ النَّبِيُّونَ تَحْتَ لِوَائِهِ فَهُمْ مِنْهُ وَإِلَيْهِ وَصَلِّ وَسَلِّمْ وَبَارِكْ عَلَيْهِ وَعَلٰى آلِهِ وَصَحْبِهِ عَدَدَ مَا خَلَقْتَ وَرَزَقْتَ وَأَمَتَّ وَأَحْيَيْتَ إِلٰى يَوْمِ تُبْعَثُ مَنْ أَفْنَيْتَ وَسَلِّمْ تَسْلِيمًا كَثِيرًا وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ',
  la: "Allahumma shalli wa sallim wa barik 'ala sayyidina wa maulana Muhammad syajaratil ashlin-nuraniyyah, wa lam'atil qabdhatir rahmaniyyah wa afdhalil khaliiqatil insaniyyah, wa asyrafish shuratil jasmaniyyah, wa ma'dinil asrarir rabbaniyyah, wa khazainil 'ulumil ishthifaiyyah, shahibil qabdhatil ashliyyah, wal bahjatis saniyyah, war rutbatil 'aliyyah, manindarajatin nabiyyuna tahta liwaih, fahum minhu wa ilaih, wa shalli wa sallim wa barik 'alaih wa 'ala alihi wa shahbihi 'adada ma khalaqta, wa razaqta wa amatta wa ahyaita ila yaumi tub'atsu man afnait, wa sallim tasliiman katsira, wal hamdu lillahi rabbil 'alamin.",
  id: 'Ya Allah, bershalawatlah, bersalamlah, dan berkatilah sayyidina wa maulana Muhammad, pohon sumber cahaya, kilatan sentuhan kasih sayang, seutama-utamanya manusia, semulia-mulianya bentuk jasad, tempat mendulang rahasia-rahasia ketuhanan, khazanah ilmu-ilmu pilihan, pemilik sentuhan universal, kebanggaan yang agung, derajat keudukan yang tinggi di mana para nabi bergabung di bawah benderanya, mereka bersumber darinya dan akan kembali kepadanya. Dan bershalawatlah, bersalamlah, dan berkatilah beliau, dan kepada keluarga dan para sahabat beliau sebanyak bilangan makhluk yang telah Engkau ciptakan, lalu Engkau beri rizki, lalu Engkau matikan dan Engkau hidupkan hingga hari di mana Engkau membangkitkan kembali makhluk yang telah Engkau hancurkan, dan bersalamlah dengan salam yang sebenar-benarnya, dan Segala pujian bagi Allah Tuhan semesta alam.',
  n: 1
};

const SHALAWAT_NARIYAH: DzikirItem = {
  t: 'Shalawat Nariyah (Tafrijiyah)',
  ar: 'اَللّٰهُمَّ صَلِّ صَلَاةً كَامِلَةً وَسَلِّمْ سَلَامًا تَامًّا عَلٰى سَيِّدِنَا مُحَمَّدٍ الَّذِي تَنْحَلُّ بِهِ الْعُقَدُ وَتَنْفَرِجُ بِهِ الْكُرَبُ وَتُقْضٰى بِهِ الْحَوَائِجُ وَتُنَالُ بِهِ الرَّغَائِبُ وَحُسْنُ الْخَوَاتِيمِ وَيُسْتَسْقَى الْغَمَامُ بِوَجْهِهِ الْكَرِيمِ وَعَلٰى آلِهِ وَصَحْبِهِ فِي كُلِّ لَمْحَةٍ وَنَفَسٍ بِعَدَدِ كُلِّ مَعْلُومٍ لَكَ',
  la: "Allahumma shalli shalatan kamilatan wa sallim salaman tamman 'ala sayyidina Muhammadinil-ladzi tanhallu bihil 'uqadu wa tanfariju bihil kurabu wa tuqdha bihil hawa'iju wa tunalu bihir ragha'ibu wa husnul khawatimi wa yustasqal ghamamu biwajhihil kariimi wa 'ala alihi wa shahbihi fi kulli lamhatin wa nafasin bi'adadi kulli ma'lumin lak.",
  id: "Ya Allah, limpahkanlah shalawat yang sempurna dan keselamatan yang menyeluruh kepada junjungan kami Nabi Muhammad, yang dengan beliau terurai segala ikatan problema, terhapus segala kesulitan, terpenuhi segala kebutuhan hajat, diraih segala dambaan dan husnul khatimah, serta diturunkan siraman rahmat melalui wajahnya yang mulia. Dan limpahkanlah pula kepada keluarga serta para sahabat beliau pada setiap kedipan mata dan hela nafas, sebanyak bilangan segala apa yang ada dalam pengetahuan-Mu.",
  n: 11
};

const SHALAWAT_MUNJIYAT: DzikirItem = {
  t: 'Shalawat Munjiyat (Penyelamat)',
  ar: 'اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ صَلَاةً تُنْجِيْنَا بِهَا مِنْ جَمِيْعِ الْأَهْوَالِ وَالْآفَاتِ، وَتَقْضِيْ لَنَا بِهَا جَمِيْعَ الْحَاجَاتِ، وَتُطَهِّرُنَا بِهَا مِنْ جَمِيْعِ السَّيِّئَاتِ، وَتَرْفَعُنَا بِهَا عِنْدَكَ أَعْلَى الدَّرَجَاتِ، وَتُبَلِّغُنَا بِهَا أَقْصَى الْغَايَاتِ مِنْ جَمِيْعِ الْخَيْرَاتِ فِي الْحَيَاةِ وَبَعْدَ الْمَمَاتِ',
  la: "Allahumma shalli 'ala sayyidina Muhammadin shalatan tunjina biha min jami'il ahwali wal afat, wa taqdhi lana biha jami'al hajat, wa tuthahhiruna biha min jami'is sayyi'at, wa tarfa'una biha 'indaka a'lad darajat, wa tuballighuna biha aqshal ghayati min jami'il khairati fil hayati wa ba'dal mamat.",
  id: "Ya Allah, limpahkanlah shalawat kepada junjungan kami Nabi Muhammad, shalawat yang dengannya Engkau menyelamatkan kami dari segala bencana dan musibah mara bahaya, Engkau penuhi bagi kami segala keperluan hajat, Engkau sucikan kami dari segala keburukan dan noda dosa, Engkau angkat kami ke derajat termulia di sisi-Mu, dan Engkau sampaikan kami pada puncak impian kebaikan hidup di dunia dan sesudah mati kelak.",
  n: 11
};

const SHALAWAT_NABI: DzikirItem = {
  t: 'Shalawat Nabi',
  ar: 'اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى آلِ سَيِّدِنَا مُحَمَّدٍ',
  la: "Allahumma shalli 'ala sayyidina Muhammad wa 'ala ali sayyidina Muhammad.",
  id: 'Ya Allah, limpahkanlah shalawat kepada junjungan kami Nabi Muhammad dan kepada keluarga junjungan kami Nabi Muhammad.',
  n: 100
};

const SAYYIDUL_ISTIGHFAR: DzikirItem = {
  t: 'Sayyidul Istighfar (Penghulu Istighfar)',
  ar: 'اَللّٰهُمَّ أَنْتَ رَبِّي لَا إِلٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلٰى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوْذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوْءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوْءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوْبَ إِلَّا أَنْتَ',
  la: "Allahumma anta Rabbi la ilaha illa anta khalaqtani wa ana 'abduka wa ana 'ala 'ahdika wa wa'dika mastatha'tu, a'udzu bika min syarri ma shana'tu, abu'u laka bini'matika 'alayya wa abu'u bidzanbi faghfir li fa innahu la yaghfirudz-dzunuba illa anta.",
  id: "Ya Allah, Engkaulah Tuhanku, tiada tuhan berhak disembah melainkan Engkau. Engkaulah yang menciptakanku dan aku hamba-Mu. Aku senantiasa menepati janji setia dan ikrar-Mu semampuku. Aku berlindung kepada-Mu dari keburukan yang telah kuperbuat. Aku mengakui segala curahan nikmat-Mu atasku dan aku mengakui segenap dosaku, maka ampunilah daku, sungguh tidak ada yang mampu mengampuni dosa selain Engkau.",
  n: 3
};

const HIZIB_BAHR: DzikirItem = {
  t: 'Hizib Bahr (Al-Imam Asy-Syadzili)',
  ar: 'اَللّٰهُمَّ يَا عَلِيُّ يَا عَظِيمُ يَا حَلِيمُ يَا عَلِيمُ، أَنْتَ رَبِّي وَعِلْمُكَ حَسْبِي، فَنِعْمَ الرَّبُّ رَبِّي وَنِعْمَ الْحَسْبُ حَسْبِي، تَنْصُرُ مَنْ تَشَاءُ وَأَنْتَ الْعَزِيزُ الرَّحِيمُ. نَسْأَلُكَ الْعِصْمَةَ فِي الْحَرَكَاتِ وَالسَّكَنَاتِ وَالْكَلِمَاتِ وَالْإِرَادَاتِ وَالْخَطَرَاتِ مِنَ الشُّكُوكِ وَالظُّنُونِ وَالْأَوْهَامِ الْقَابِضَةِ لِلْقُلُوبِ عَنْ مُطَالَعَةِ الْغُيُوبِ. فَقَدِ ابْتُلِيَ الْمُؤْمِنُونَ وَزُلْزِلُوا زِلْزَالًا شَدِيدًا. وَسَخِّرْ لَنَا هٰذَا الْبَحْرَ كَمَا سَخَّرْتَ الْبَحْرَ لِمُوسَىٰ...',
  la: "Allahumma ya 'Aliyyu ya 'Azhimu ya Halimu ya 'Alim, Anta Rabbi wa 'ilmuka hasbi, fani'mar-Rabbu Rabbi wa ni'mal-hasbu hasbi, tansyuru man tasya'u wa Antal 'Azizur Rahim...",
  id: "Ya Allah, wahai Dzat Yang Maha Luhur, Maha Agung, Maha Penyantun lagi Maha Mengetahui. Engkaulah Tuhanku dan ilmu-Mu adalah pencukup bagiku. Sebaik-baik Tuhan adalah Tuhanku dan sebaik-baik pencukup adalah kecukupan-Mu. Engkau menolong siapa saja yang Engkau kehendaki dan Engkaulah Yang Maha Perkasa lagi Maha Penyayang...",
  n: 1
};

const HIZIB_NASHR: DzikirItem = {
  t: 'Hizib Nashr (Doa Perlindungan & Pertolongan)',
  ar: 'اَللّٰهُمَّ بِسَطْوَةِ جَبَرُوتِ قَهْرِكَ، وَبِسُرْعَةِ إِغَاثَةِ نَصْرِكَ، وَبِغَيْرَتِكَ لِانْتِهَاكِ حُرُمَاتِكَ، وَبِحِمَايَتِكَ لِمَنِ احْتَمَى بِآيَاتِكَ، نَسْأَلُكَ يَا اللّٰهُ يَا سَمِيعُ يَا قَرِيبُ يَا مُجِيبُ يَا سَرِيعُ يَا مُنْتَقِمُ يَا شَدِيدَ الْبَطْشِ يَا جَبَّارُ يَا قَهَّارُ يَا مَنْ لَا يُعْجِزُهُ قَهْرُ الْجَبَابِرَةِ، أَنْ تَجْعَلَ كَيْدَ مَنْ كَادَنَا فِي نَحْرِهِ، وَمَكْرَ مَنْ مَكَرَ بِنَا عَائِدًا عَلَيْهِ...',
  la: "Allahumma bisathwati jabaruti qahrik, wa bisur'ati ighatsati nashrik, wa bighairatika li-intihaki hurumatik, wa bihimayatika liman ihtama bi-ayatik...",
  id: "Ya Allah, dengan kedahsyatan kekuatan keperkasaan-Mu, dan dengan kecepatan pertolongan pertahanan-Mu, dan dengan kecemburuan-Mu demi terjaganya kehormatan-Mu, dan dengan perlindungan-Mu bagi siapa saja yang berlindung dengan ayat-ayat-Mu. Kami memohon kepada-Mu wahai Allah, wahai Dzat Yang Maha Mendengar, wahai Yang Maha Dekat, wahai Yang Mengabulkan doa...",
  n: 1
};

const ROTIB_HADDAD_ITEMS: DzikirItem[] = [
  FATIHAH,
  KURSI,
  {
    t: 'Amanar Rasulu (QS. Al-Baqarah: 285-286)',
    ar: 'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ ۚ وَقَالُوا سَمِعْنَا وَأَطَعْنَا ۖ غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ [٢٨٥] لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ۚ لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ ۗ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ [٢٨٦]',
    la: "Amanar-rasulu bima unzila ilaihi mir-rabbihi wal mu'minun. Kullun amana billahi wa mala'ikatihi wa kutubihi wa rusulih, la nufarriqu baina ahadim mir-rusulih. Wa qalu sami'na wa atha'na ghufranaka Rabbana wa ilaikal mashir. La yukallifullahu nafsan illa wus'aha...",
    id: "Rasul (Muhammad) beriman kepada apa yang diturunkan kepadanya dari Tuhannya, demikian pula orang-orang yang beriman. Semua beriman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya dan rasul-rasul-Nya...",
    n: 1
  },
  {
    t: 'Tahlil Tauhid Ratib',
    ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلٰى كُلِّ شَيْءٍ قَدِيرٌ',
    la: "La ilaha illallahu wahdahu la syarika lah, lahul mulku wa lahul hamdu yuhyi wa yumitu wa huwa 'ala kulli syai'in qadir.",
    id: "Tiada Tuhan selain Allah, Maha Esa tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan segala puji, Dia Yang menghidupkan dan mematikan, dan Dia Maha Kuasa atas segala sesuatu.",
    n: 3
  },
  {
    t: 'Tasbih & Tahmid',
    ar: 'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ',
    la: "Subhanallahi wal hamdulillahi wa la ilaha illallahu wallahu akbar.",
    id: "Maha Suci Allah, segala puji bagi Allah, tiada Tuhan selain Allah, dan Allah Maha Besar.",
    n: 3
  },
  {
    t: 'Tasbih Agung',
    ar: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ، سُبْحَانَ اللّٰهِ الْعَظِيمِ',
    la: "Subhanallahi wa bihamdih, Subhanallahil 'azhim.",
    id: "Maha Suci Allah dengan memuji-Nya, Maha Suci Allah Yang Maha Agung.",
    n: 3
  },
  {
    t: 'Permohonan Ampunan & Tobat',
    ar: 'رَبَّنَا اغْفِرْ لَنَا وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    la: "Rabbanaghfir lana wa tub 'alaina innaka antat-tawwabur-rahim.",
    id: "Wahai Tuhan kami, ampunilah kami dan terimalah tobat kami, sungguh Engkau Maha Penerima tobat lagi Maha Penyayang.",
    n: 3
  },
  {
    t: 'Shalawat Ratib',
    ar: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ، اَللّٰهُمَّ صَلِّ عَلَيْهِ وَسَلِّمْ',
    la: "Allahumma shalli 'ala Muhammad, Allahumma shalli 'alaihi wa sallim.",
    id: "Ya Allah, limpahkanlah shalawat kepada Nabi Muhammad. Ya Allah, limpahkanlah shalawat dan salam atas beliau.",
    n: 3
  },
  {
    t: 'Perlindungan Kalimat Allah',
    ar: 'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    la: "A'udzu bikalimatillahit-tammati min syarri ma khalaq.",
    id: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan segala makhluk yang Dia ciptakan.",
    n: 3
  },
  {
    t: 'Bismillah Tolak Bala',
    ar: 'بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    la: "Bismillahil-ladzi la yadhurru ma'asmihi syai'un fil ardhi wa la fis-sama'i wa huwas-sami'ul 'alim.",
    id: "Dengan nama Allah yang bersama nama-Nya tiada sesuatu pun di bumi dan di langit dapat mendatangkan celaka bahaya, dan Dia Maha Mendengar lagi Maha Mengetahui.",
    n: 3
  },
  {
    t: 'Ridha Keimanan',
    ar: 'رَضِيْنَا بِاللّٰهِ رَبًّا وَبِالْإِسْلَامِ دِيْنًا وَبِمُحَمَّدٍ نَبِيًّا',
    la: "Radhina billahi Rabba, wa bil Islami dina, wa bi Muhammadin nabiyya.",
    id: "Kami ridha Allah sebagai Tuhan kami, Islam sebagai agama kami, dan Nabi Muhammad sebagai nabi kami.",
    n: 3
  },
  {
    t: 'Kebaikan Kehendak Allah',
    ar: 'بِسْمِ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَالْخَيْرُ وَالشَّرُّ بِمَشِيئَةِ اللّٰهِ',
    la: "Bismillahi wal hamdulillahi wal khairu wasy-syarru bimasyi'atillah.",
    id: "Dengan nama Allah dan segala puji bagi Allah, dan segala kebaikan maupun keburukan terjadi atas kehendak Allah.",
    n: 3
  },
  {
    t: 'Iman & Tobat Lahir Batin',
    ar: 'آمَنَّا بِاللّٰهِ وَالْيَوْمِ الْآخِرِ تُبْنَا إِلَى اللّٰهِ بَاطِنًا وَظَاهِرًا',
    la: "Amanna billahi wal yaumil akhiri tubna ilallahi bathinaw wa zhahira.",
    id: "Kami beriman kepada Allah dan hari akhir, kami bertobat kepada Allah secara lahir maupun batin.",
    n: 3
  },
  {
    t: 'Permohonan Maaf & Penghapusan Dosa',
    ar: 'يَا رَبَّنَا وَاعْفُ عَنَّا وَامْحُ الَّذِي كَانَ مِنَّا',
    la: "Ya Rabbana wa'fu 'anna wamhulladzi kana minna.",
    id: "Wahai Tuhan kami, maafkanlah kami dan hapuslah segala kesalahan kekhilafan yang ada pada diri kami.",
    n: 3
  },
  {
    t: 'Doa Wafat dalam Islam',
    ar: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ أَمِتْنَا عَلٰى دِينِ الْإِسْلَامِ',
    la: "Ya Dzal Jalaali wal Ikram amitna 'ala dinil Islam.",
    id: "Wahai Dzat Pemilik Keagungan dan Kemuliaan, matikanlah kami tetap teguh di atas agama Islam.",
    n: 7
  },
  {
    t: 'Perlindungan dari Orang Zalim',
    ar: 'يَا قَوِيُّ يَا مَتِينُ اكْفِ شَرَّ الظَّالِمِينَ',
    la: "Ya Qawiyyu ya Matiin ikfi syarrazh-zhalimin.",
    id: "Wahai Yang Maha Kuat lagi Maha Kokoh, hindarkanlah kami dari kejahatan orang-orang zalim.",
    n: 3
  },
  {
    t: 'Kemashlahatan Kaum Muslimin',
    ar: 'أَصْلَحَ اللّٰهُ أُمُورَ الْمُسْلِمِينَ صَرَفَ اللّٰهُ شَرَّ الْمُؤْذِينَ',
    la: "Ashlahallahu umural muslimin sharafallahu syarral mu'dzin.",
    id: "Semoga Allah memperbaiki urusan kaum muslimin dan menyingkirkan kejahatan orang-orang yang gemar menyakiti.",
    n: 3
  },
  {
    t: 'Asmaul Husna Al-Lathif',
    ar: 'يَا عَلِيُّ يَا كَبِيرُ يَا عَلِيمُ يَا قَدِيرُ يَا سَمِيعُ يَا بَصِيرُ يَا لَطِيفُ يَا خَبِيرُ',
    la: "Ya 'Aliyyu ya Kabir ya 'Alimu ya Qadir ya Sami'u ya Bashir ya Lathifu ya Khabir.",
    id: "Wahai Dzat Yang Maha Luhur, Maha Besar, Maha Mengetahui, Maha Kuasa, Maha Mendengar, Maha Melihat, Maha Lembut lagi Maha Mengetahui rahasia.",
    n: 3
  },
  {
    t: 'Pelepas Kesedihan',
    ar: 'يَا فَارِجَ الْهَمِّ يَا كَاشِفَ الْغَمِّ يَا مَنْ لِعَبْدِهِ يَغْفِرُ وَيَرْحَمُ',
    la: "Ya Farijal hammi ya Kasyifal ghammi ya Man li'abdihi yaghfiru wa yarham.",
    id: "Wahai Dzat Yang melapangkan kegundahan, wahai Yang melenyapkan kesedihan duka, wahai Dzat Yang senantiasa mengampuni dan merahmati hamba-Nya.",
    n: 3
  },
  {
    t: 'Istighfar Ratib',
    ar: 'أَسْتَغْفِرُ اللّٰهَ رَبَّ الْبَرَايَا، أَسْتَغْفِرُ اللّٰهَ مِنَ الْخَطَايَا',
    la: "Astaghfirullah Rabbal baraya, astaghfirullah minal khathaya.",
    id: "Aku memohon ampun kepada Allah Tuhan semesta pencipta, aku memohon ampun kepada Allah dari segala kesalahan dosa.",
    n: 4
  },
  {
    t: 'Kalimah Thayyibah',
    ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    la: "La ilaha illallah.",
    id: "Tiada Tuhan selain Allah.",
    n: 50
  },
  {
    t: 'Penutup Ratib',
    ar: 'مُحَمَّدٌ رَسُولُ اللّٰهِ صَلَّى اللّٰهُ عَلَيْهِ وَآلِهِ وَسَلَّمَ وَشَرَّفَ وَكَرَّمَ وَمَجَّدَ وَعَظَّمَ، وَرَضِيَ اللّٰهُ تَعَالَى عَنْ أَهْلِ بَيْتِهِ الْمُطَهَّرِينَ وَأَصْحَابِهِ الْمُهْتَدِينَ وَالتَّابِعِينَ لَهُمْ بِإِحْسَانٍ إِلَى يَوْمِ الدِّينِ',
    la: "Muhammadur-rasulullahi shallallahu 'alaihi wa alihi wa sallama wa syarrafa wa karrama wa majjada wa 'azhzham...",
    id: "Nabi Muhammad adalah utusan Allah, semoga Allah melimpahkan shalawat, salam, kemuliaan, dan keagungan kepada beliau dan keluarganya yang suci serta para sahabatnya...",
    n: 1
  }
];

const ROTIB_ATHOS_ITEMS: DzikirItem[] = [
  FATIHAH,
  {
    t: 'Taawwudz Ratib Athos',
    ar: 'أَعُوْذُ بِكَلِمَاتِ اللّٰهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    la: "A'udzu bikalimatillahit-tammati min syarri ma khalaq.",
    id: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan segala makhluk-Nya.",
    n: 3
  },
  {
    t: 'Bismillah Penjagaan Semesta',
    ar: 'بِسْمِ اللّٰهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    la: "Bismillahil-ladzi la yadhurru ma'asmihi syai'un fil ardhi wa la fis-sama'i wa huwas-sami'ul 'alim.",
    id: "Dengan nama Allah yang bersama asma-Nya tiada marabahaya yang membinasakan di bumi maupun di langit.",
    n: 3
  },
  {
    t: 'Ridha Keimanan',
    ar: 'رَضِيْنَا بِاللّٰهِ رَبًّا وَبِالْإِسْلَامِ دِيْنًا وَبِمُحَمَّدٍ نَبِيًّا',
    la: "Radhina billahi Rabba, wa bil Islami dina, wa bi Muhammadin nabiyya.",
    id: "Kami ridha Allah sebagai Tuhan, Islam sebagai agama, dan Nabi Muhammad sebagai nabi kami.",
    n: 3
  },
  {
    t: 'Doa Kelembutan Allah (Lathif)',
    ar: 'يَا لَطِيفًا لَمْ يَزَلْ، اُلْطُفْ بِنَا فِيمَا نَزَلْ، إِنَّكَ لَطِيفٌ لَمْ تَزَلْ، اُلْطُفْ بِنَا وَالْمُسْلِمِينَ',
    la: "Ya Lathifan lam yazal, ulthuf bina fima nazal, innaka Lathifun lam tazal, ulthuf bina wal muslimin.",
    id: "Wahai Dzat Yang senantiasa Maha Lembut Kasih-Nya, berlemah lembutlah kepada kami dalam segala takdir yang menimpa, sungguh Engkau senantiasa Maha Lembut, berlemah-lembutlah kepada kami dan segenap kaum muslimin.",
    n: 3
  },
  {
    t: 'Asmaul Lathif Khusus',
    ar: 'يَا لَطِيفًا بِخَلْقِهِ، يَا عَلِيمًا بِخَلْقِهِ، يَا خَبِيرًا بِخَلْقِهِ، اُلْطُفْ بِنَا يَا لَطِيفُ يَا عَلِيمُ يَا خَبِيرُ',
    la: "Ya Lathifan bikhalqih, ya 'Aliman bikhalqih, ya Khabiran bikhalqih, ulthuf bina ya Lathifu ya 'Alimu ya Khabir.",
    id: "Wahai Yang Maha Lembut kepada makhluk-Nya, wahai Yang Maha Mengetahui makhluk-Nya, wahai Yang Mengamati makhluk-Nya, santunilah kami wahai Yang Maha Lembut, Maha Mengetahui lagi Maha Teliti.",
    n: 3
  },
  {
    t: 'Tahlil Tauhid Ratib',
    ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    la: "La ilaha illallah.",
    id: "Tiada Tuhan selain Allah.",
    n: 33
  }
];

const CATEGORIES: DzikirCategory[] = [
  {
    id: 'shalat',
    name: 'Dzikir Shalat',
    color: '#5b5fdc',
    art: 'sit',
    cols: [
      {
        id: 'setelah-shalat',
        title: 'Dzikir Setelah Shalat Maktubah',
        items: [
          {
            t: 'Istighfar Pembuka',
            ar: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ الَّذِي لَا إِلٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
            la: "Astaghfirullahal 'azhimal-ladzi la ilaha illa huwal hayyul qayyumu wa atubu ilaih.",
            id: 'Aku memohon ampun kepada Allah Yang Maha Agung, tiada Tuhan selain Dia, Yang Maha Hidup lagi Maha Berdiri Sendiri, dan aku bertobat kepada-Nya.',
            n: 3
          },
          {
            t: 'Doa Keselamatan & Kedamaian',
            ar: 'اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ وَإِلَيْكَ يَعُودُ السَّلَامُ فَحَيِّنَا رَبَّنَا بِالسَّلَامِ وَأَدْخِلْنَا الْجَنَّةَ دَارَ السَّلَامِ تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
            la: "Allahumma antas-salamu wa minkas-salam wa ilaika ya'udus-salam fahayyina Rabbana bis-salam wa adkhilnal jannata daras-salam tabarakta Rabbana wa ta'alaita ya Dzal Jalaali wal Ikram.",
            id: 'Ya Allah, Engkaulah sumber keselamatan dan dari-Mulah segala keselamatan dan kepada-Mulah keselamatan itu kembali, maka hidupkanlah kami dengan selamat damai dan masukkanlah kami ke surga tempat keselamatan.',
            n: 1
          },
          {
            t: 'Tasbih',
            ar: 'سُبْحَانَ اللّٰهِ',
            la: 'Subhanallah.',
            id: 'Mahasuci Allah.',
            n: 33
          },
          {
            t: 'Tahmid',
            ar: 'اَلْحَمْدُ لِلّٰهِ',
            la: 'Alhamdulillah.',
            id: 'Segala puji bagi Allah.',
            n: 33
          },
          {
            t: 'Takbir',
            ar: 'اَللّٰهُ أَكْبَرُ',
            la: 'Allahu akbar.',
            id: 'Allah Mahabesar.',
            n: 33
          },
          {
            t: 'Tahlil Penyempurna',
            ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلٰى كُلِّ شَيْءٍ قَدِيرٌ',
            la: "La ilaha illallahu wahdahu la syarika lah, lahul mulku wa lahul hamdu yuhyi wa yumitu wa huwa 'ala kulli syai'in qadir.",
            id: 'Tiada tuhan selain Allah semata, tiada sekutu bagi-Nya. Milik-Nya kerajaan dan milik-Nya segala puji, Dia Yang menghidupkan dan mematikan, dan Dia Mahakuasa atas segala sesuatu.',
            n: 1
          },
          KURSI
        ]
      }
    ]
  },
  {
    id: 'ratib',
    name: 'Rotib & Hizib',
    color: '#059669',
    art: 'dua',
    cols: [
      {
        id: 'haddad',
        title: 'Rotib Al-Haddad Lengkap',
        items: ROTIB_HADDAD_ITEMS
      },
      {
        id: 'athos',
        title: 'Rotib Al-Athos',
        items: ROTIB_ATHOS_ITEMS
      },
      {
        id: 'hizib-bahr',
        title: 'Hizib Bahr (Asy-Syadzili)',
        items: [HIZIB_BAHR]
      },
      {
        id: 'hizib-nashr',
        title: 'Hizib Nashr',
        items: [HIZIB_NASHR]
      }
    ]
  },
  {
    id: 'matsurat',
    name: "Al Ma'tsurat",
    color: '#ff8a47',
    art: 'dua',
    cols: [
      {
        id: 'pagi',
        title: "Al Ma'tsurat Pagi",
        items: [FATIHAH, KURSI, IKHLAS, FALAQ, NAS, SAYYIDUL_ISTIGHFAR]
      },
      {
        id: 'petang',
        title: "Al Ma'tsurat Petang (Sore)",
        items: [FATIHAH, KURSI, IKHLAS, FALAQ, NAS, SAYYIDUL_ISTIGHFAR]
      }
    ]
  },
  {
    id: 'shalawat',
    name: 'Shalawat',
    color: '#ec4067',
    art: 'read',
    cols: [
      { id: 'nariyah', title: 'Shalawat Nariyah (Tafrijiyah)', items: [SHALAWAT_NARIYAH] },
      { id: 'munjiyat', title: 'Shalawat Munjiyat (Penyelamat)', items: [SHALAWAT_MUNJIYAT] },
      { id: 'nuroniyah', title: 'Shalawat Nuroniyah (Badawi)', items: [NURANIYAH] },
      { id: 'nabi', title: 'Shalawat Nabi 100x', items: [SHALAWAT_NABI] }
    ]
  },
  {
    id: 'lainnya',
    name: 'Dzikir Lainnya',
    color: '#1fa38f',
    art: 'books',
    cols: [
      {
        id: 'harian',
        title: 'Dzikir Harian & Penenang Jiwa',
        items: [
          SAYYIDUL_ISTIGHFAR,
          {
            t: 'Hauqalah',
            ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
            la: "La haula wa la quwwata illa billahil 'aliyyil 'azhim.",
            id: 'Tiada daya upaya dan tiada kekuatan melainkan semata dengan pertolongan Allah Yang Maha Tinggi lagi Maha Agung.',
            n: 10
          },
          {
            t: 'Tasbih dan Tahmid',
            ar: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ',
            la: 'Subhanallahi wa bihamdih.',
            id: 'Mahasuci Allah dan segala puji bagi-Nya.',
            n: 100
          },
          {
            t: 'Tasbih Agung',
            ar: 'سُبْحَانَ اللّٰهِ الْعَظِيمِ',
            la: "Subhanallahil 'azhim.",
            id: 'Mahasuci Allah Yang Maha Agung.',
            n: 33
          },
          {
            t: 'Istighfar dan Tobat',
            ar: 'أَسْتَغْفِرُ اللّٰهَ وَأَتُوبُ إِلَيْهِ',
            la: 'Astaghfirullaha wa atubu ilaih.',
            id: 'Aku memohon ampun kepada Allah dan bertobat kepada-Nya.',
            n: 100
          }
        ]
      }
    ]
  }
];

export const DzikirView: React.FC<DzikirViewProps> = ({
  isOpen,
  onClose,
  initialCategoryId
}) => {
  // Navigation states: 'home' | 'list' | 'viewer'
  const [currentScreen, setCurrentScreen] = useState<'home' | 'list' | 'viewer'>('home');
  const [activeCategory, setActiveCategory] = useState<DzikirCategory>(CATEGORIES[0]);
  const [activeCollection, setActiveCollection] = useState<DzikirCollection>(CATEGORIES[0].cols[0]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Tasbih Counter States (Separate for Home Tasbih and Viewer Tasbih)
  const [homeCount, setHomeCount] = useState<number>(0);
  const [homeTarget, setHomeTarget] = useState<number>(100);

  const [viewerCount, setViewerCount] = useState<number>(0);
  const [viewerTarget, setViewerTarget] = useState<number>(1);

  // Settings: Haptics & Sound preferences (persisted in localStorage)
  const [cfg, setCfg] = useState<{
    vibTap: boolean;
    sndTap: boolean;
    vibDone: boolean;
    sndDone: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('dzikir-cfg');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { vibTap: true, sndTap: true, vibDone: true, sndDone: true };
  });

  const saveCfg = (newCfg: typeof cfg) => {
    setCfg(newCfg);
    try {
      localStorage.setItem('dzikir-cfg', JSON.stringify(newCfg));
    } catch (e) {}
  };

  // Dialog & Menu states
  const [isTargetDialogOpen, setIsTargetDialogOpen] = useState<boolean>(false);
  const [targetDialogScope, setTargetDialogScope] = useState<'home' | 'viewer'>('home');
  const [targetInputValue, setTargetInputValue] = useState<string>('');
  const [targetDialogError, setTargetDialogError] = useState<string>('');

  const [isCfgDialogOpen, setIsCfgDialogOpen] = useState<boolean>(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);

  // View settings
  const [showCounterInViewer, setShowCounterInViewer] = useState<boolean>(true);
  const [showLatin, setShowLatin] = useState<boolean>(true);
  const [showTerjemah, setShowTerjemah] = useState<boolean>(true);
  const [arabicFontSize, setArabicFontSize] = useState<number>(28);

  // Audio / Speech state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  }, []);

  // Back handling with hardware / browser back button
  useBackHandler(Boolean(isOpen && currentScreen === 'viewer'), 'dzikir-viewer-screen', () => {
    stopSpeech();
    if (activeCategory.cols.length > 1) {
      setCurrentScreen('list');
    } else {
      setCurrentScreen('home');
    }
  });

  useBackHandler(Boolean(isOpen && currentScreen === 'list'), 'dzikir-list-screen', () => {
    setCurrentScreen('home');
  });

  useBackHandler(Boolean(isOpen && currentScreen === 'home'), 'dzikir-home-screen', () => {
    onClose();
  });

  // Haptic Feedback
  const triggerVibrate = useCallback((pattern: number | number[]) => {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }, []);

  // Web Audio Synthesizer Beep & Chime
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((freq = 880, dur = 0.07, vol = 0.25) => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (e) {}
  }, []);

  const playChime = useCallback(() => {
    playBeep(660, 0.2, 0.3);
    setTimeout(() => {
      playBeep(990, 0.4, 0.3);
    }, 160);
  }, [playBeep]);

  // Handle Tap for Tasbih
  const handleTap = (scope: 'home' | 'viewer', e: React.MouseEvent<HTMLButtonElement>) => {
    // Ripple effect
    createRipple(e);

    if (scope === 'home') {
      const nextCount = homeCount + 1;
      setHomeCount(nextCount);
      const isDone = nextCount >= homeTarget;

      if (isDone) {
        if (cfg.vibDone) triggerVibrate([240, 120, 240, 120, 440]);
        else if (cfg.vibTap) triggerVibrate(110);
        if (cfg.sndDone) playChime();
        else if (cfg.sndTap) playBeep(880, 0.07, 0.25);
        showToast(`Target ${homeTarget}x tercapai! Alhamdulillah`);
        setTimeout(() => {
          setHomeCount(0);
        }, 500);
      } else {
        if (cfg.vibTap) triggerVibrate(110);
        if (cfg.sndTap) playBeep(880, 0.07, 0.25);
      }
    } else {
      const nextCount = viewerCount + 1;
      setViewerCount(nextCount);
      const isDone = nextCount >= viewerTarget;

      if (isDone) {
        if (cfg.vibDone) triggerVibrate([240, 120, 240, 120, 440]);
        else if (cfg.vibTap) triggerVibrate(110);
        if (cfg.sndDone) playChime();
        else if (cfg.sndTap) playBeep(880, 0.07, 0.25);

        // Auto-advance to next item if available
        if (activeItemIndex < activeCollection.items.length - 1) {
          showToast(`Selesai ${viewerTarget}x. Berlanjut ke dzikir berikutnya...`);
          setTimeout(() => {
            goToItem(activeItemIndex + 1);
          }, 500);
        } else {
          showToast('Selesai seluruh dzikir. Alhamdulillah');
          setTimeout(() => {
            setViewerCount(0);
          }, 500);
        }
      } else {
        if (cfg.vibTap) triggerVibrate(110);
        if (cfg.sndTap) playBeep(880, 0.07, 0.25);
      }
    }
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const radius = rect.width / 2;

    // Titik klik relatif terhadap tombol (fallback ke titik tengah bila tidak ada koordinat)
    const hasValidCoords = typeof e.clientX === 'number' && e.clientX > 0;
    const clickX = hasValidCoords ? e.clientX - rect.left : radius;
    const clickY = hasValidCoords ? e.clientY - rect.top : radius;

    // Jarak dari pusat tombol ke titik klik
    const distFromCenter = Math.hypot(clickX - radius, clickY - radius);

    // Jarak terjauh dari titik klik ke tepi lingkaran tombol
    // Pada lingkaran berjari-jari R, titik tepi terjauh dari titik klik berjarak R + distFromCenter
    const maxReach = radius + distFromCenter;
    const diameter = maxReach * 2;

    const span = document.createElement('span');
    span.style.position = 'absolute';
    span.style.width = `${diameter}px`;
    span.style.height = `${diameter}px`;
    span.style.left = `${clickX - maxReach}px`;
    span.style.top = `${clickY - maxReach}px`;
    span.style.borderRadius = '50%';
    span.style.backgroundColor = 'rgba(255, 255, 255, 0.45)';
    span.style.pointerEvents = 'none';
    span.style.transform = 'scale(0)';
    span.style.animation = 'ripple 0.6s linear forwards';

    const cleanup = () => {
      if (span.parentNode) {
        span.remove();
      }
    };
    span.addEventListener('animationend', cleanup);
    setTimeout(cleanup, 650);

    btn.appendChild(span);
  };

  // Open Category
  const openCategory = (cat: DzikirCategory) => {
    setActiveCategory(cat);
    if (cat.cols.length === 1) {
      openCollection(cat.cols[0]);
    } else {
      setCurrentScreen('list');
    }
  };

  // Open Collection
  const openCollection = (col: DzikirCollection) => {
    setActiveCollection(col);
    setActiveItemIndex(0);
    setCurrentScreen('viewer');
    loadItem(col.items[0]);
  };

  // Load specific item into viewer
  const loadItem = (item: DzikirItem) => {
    setViewerCount(0);
    setViewerTarget(item.n || 1);
    stopSpeech();
  };

  // Navigation within collection
  const goToItem = (idx: number) => {
    if (idx < 0 || idx >= activeCollection.items.length) return;
    setActiveItemIndex(idx);
    loadItem(activeCollection.items[idx]);
  };

  // Speech Synthesis (Audio recitation)
  const stopSpeech = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setIsPlayingAudio(false);
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('Audio belum didukung di perangkat ini');
      return;
    }
    if (isPlayingAudio) {
      stopSpeech();
      return;
    }
    const currentItem = activeCollection.items[activeItemIndex];
    if (!currentItem) return;

    try {
      const cleanArabic = currentItem.ar.replace(/\[[٠-٩]+\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanArabic);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    } catch (e) {
      showToast('Gagal memutar audio');
      setIsPlayingAudio(false);
    }
  };

  // Copy & Share
  const currentItem = activeCollection.items[activeItemIndex] || activeCollection.items[0];

  const getFullItemText = () => {
    const cleanAr = currentItem.ar.replace(/\[[٠-٩]+\]/g, '');
    return `${currentItem.t}\n\n${cleanAr}\n\n${currentItem.la}\n\n${currentItem.id}\n\n(Dibaca ${currentItem.n}x)`;
  };

  const handleCopy = () => {
    const text = getFullItemText();
    navigator.clipboard?.writeText(text).then(
      () => showToast('Teks bacaan berhasil disalin'),
      () => showToast('Gagal menyalin teks')
    );
  };

  const handleShare = () => {
    const text = getFullItemText();
    if (navigator.share) {
      navigator.share({ title: currentItem.t, text }).catch(() => handleCopy());
    } else {
      handleCopy();
    }
  };

  // Set initial category if given
  useEffect(() => {
    if (isOpen && initialCategoryId) {
      const found = CATEGORIES.find((c) => c.id === initialCategoryId);
      if (found) {
        openCategory(found);
      }
    }
  }, [isOpen, initialCategoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100050] bg-[#fbf9f2] text-slate-800 font-sans flex flex-col select-none overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-slate-200">
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>

      {/* ================= 1. HOME SCREEN (BERANDA PANDUAN DZIKIR) ================= */}
      {currentScreen === 'home' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Bar Warna Hijau Identik Al-Qur'an (#4f9a50) */}
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-20">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide text-center">
              Panduan Dzikir
            </h1>
            <div className="w-10 h-10" />
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
            {/* Welcome Banner */}
            <div className="flex items-center gap-4 bg-[#fcfaf5] rounded-2xl p-4.5 border border-amber-900/15 shadow-2xs">
              <svg viewBox="0 0 100 100" className="w-13 h-13 shrink-0" aria-hidden="true">
                <polygon
                  points="50,6 88,28 88,72 50,94 12,72 12,28"
                  fill="#4f9a50"
                  stroke="#4f9a50"
                  strokeWidth="8"
                  strokeLinejoin="round"
                />
                <g fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M34 66 C32 56 34 46 38 38 C40 34 44 36 43 41 L42 50 M43 41 L46 30 C47 26 51 27 50 32 L48 44 M50 32 L54 28 C57 26 59 29 57 33 L52 46 M57 33 L61 33 C63 34 63 37 62 40 L56 56 C54 62 50 66 46 70 L40 72" />
                </g>
                <g fill="#fff">
                  <circle cx="64" cy="48" r="2.6" />
                  <circle cx="67" cy="55" r="2.6" />
                  <circle cx="67" cy="63" r="2.6" />
                  <circle cx="63" cy="70" r="2.6" />
                </g>
              </svg>
              <p className="text-xs sm:text-[13px] leading-relaxed text-slate-700 font-normal">
                Selamat datang di fitur <strong className="text-emerald-800 font-semibold">Panduan Dzikir</strong>. Kumpulan doa-doa Dzikir dilengkapi dengan Tasbih Digital dan panduan Dzikir secara interaktif.
              </p>
            </div>

            {/* Grid Kategori Dzikir */}
            <div className="grid grid-cols-2 gap-3.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => openCategory(cat)}
                  className="relative overflow-hidden h-32 rounded-2xl bg-[#fcfaf5] hover:bg-emerald-50/60 text-left p-4 flex items-center justify-between border border-amber-900/15 transition-all active:scale-[0.98] cursor-pointer group shadow-2xs"
                >
                  <span className="relative z-10 max-w-[62%] font-bold text-sm sm:text-base text-slate-800 group-hover:text-emerald-800 leading-snug">
                    {cat.name}
                  </span>

                  {/* SVG Art Vector for each category */}
                  <div className="absolute right-0 bottom-0 h-full w-24 pointer-events-none opacity-90 group-hover:scale-105 transition-transform">
                    {cat.art === 'books' ? (
                      <svg viewBox="40 0 80 120" className="h-full w-full" preserveAspectRatio="xMaxYMax meet">
                        <circle cx="92" cy="84" r="46" fill="#4f9a50" opacity="0.85" />
                        <rect x="46" y="30" width="20" height="82" rx="2" fill="#7a5230" />
                        <rect x="46" y="44" width="20" height="4" fill="#d9b25a" />
                        <rect x="46" y="96" width="20" height="4" fill="#d9b25a" />
                        <rect x="68" y="26" width="20" height="86" rx="2" fill="#2e3a2f" />
                        <rect x="68" y="42" width="20" height="4" fill="#d9b25a" />
                        <rect x="68" y="98" width="20" height="4" fill="#d9b25a" />
                        <rect x="90" y="34" width="20" height="78" rx="2" fill="#a47c38" />
                        <rect x="90" y="48" width="20" height="4" fill="#efe0b0" />
                        <rect x="90" y="96" width="20" height="4" fill="#efe0b0" />
                        <g fill="#d9b25a">
                          <circle cx="50" cy="116" r="3.2" />
                          <circle cx="58" cy="118" r="3.2" />
                          <circle cx="66" cy="118" r="3.2" />
                          <circle cx="74" cy="118" r="3.2" />
                          <circle cx="82" cy="117" r="3.2" />
                        </g>
                      </svg>
                    ) : (
                      <svg viewBox="40 0 80 120" className="h-full w-full" preserveAspectRatio="xMaxYMax meet">
                        <circle cx="86" cy="78" r="48" fill="#4f9a50" opacity="0.85" />
                        <path d="M44 120 C46 94 62 84 82 86 C102 88 116 100 120 120 Z" fill="#f3f0f8" />
                        <rect x="72" y="62" width="14" height="26" rx="6" fill="#e0ad86" />
                        <ellipse cx="78" cy="48" rx="16" ry="20" fill="#e0ad86" />
                        <path d="M62 46 C60 26 74 22 84 25 C94 28 96 40 94 48 C90 38 76 36 62 46 Z" fill="#2b2530" />
                        {cat.art === 'dua' && (
                          <>
                            <path d="M72 104 C76 86 86 74 88 58 L98 62 C96 78 92 96 90 114 Z" fill="#f3f0f8" />
                            <ellipse cx="91" cy="52" rx="7" ry="11" fill="#e0ad86" transform="rotate(12 91 52)" />
                          </>
                        )}
                        {cat.art === 'read' && (
                          <g transform="rotate(-12 56 112)">
                            <rect x="40" y="94" width="62" height="34" rx="3" fill="#2f2b3a" />
                            <rect x="44" y="97" width="26" height="28" fill="#efe6cf" />
                            <rect x="72" y="97" width="26" height="28" fill="#efe6cf" />
                          </g>
                        )}
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tasbih Digital Pinned di Bawah Beranda */}
          <div className="shrink-0 flex flex-col items-center pt-3 pb-2 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs">
            <p className="text-xs font-bold tracking-wider text-emerald-800 uppercase mb-2.5">
              TASBIH DIGITAL
            </p>

            <div className="relative w-full h-[174px] flex items-center justify-center">
              {/* Tombol Samping Kiri: Pengaturan Tasbih (Gear) */}
              <button
                type="button"
                onClick={() => setIsCfgDialogOpen(true)}
                className="absolute left-[calc(25%-54px)] top-[calc(50%-32px)] -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-emerald-800 border border-slate-200/90 flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 transition-colors"
                title="Pengaturan Tasbih"
              >
                <Settings className="w-5 h-5 text-emerald-800" />
              </button>

              {/* Tombol Samping Kiri Bawah: Reset Hitungan */}
              <button
                type="button"
                onClick={() => {
                  setHomeCount(0);
                  triggerVibrate(60);
                  showToast('Hitungan tasbih diatur ulang');
                }}
                className="absolute left-[calc(25%-54px)] top-[calc(50%+32px)] -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-emerald-800 border border-slate-200/90 flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 transition-colors"
                title="Atur Ulang Hitungan"
              >
                <RotateCcw className="w-5 h-5 text-emerald-800" />
              </button>

              {/* Lingkaran Progress & Tombol Ketuk Utama */}
              <div
                className="w-[172px] h-[172px] rounded-full p-[3px] flex items-center justify-center shadow-md bg-white border border-slate-200/70"
                style={{
                  background: `conic-gradient(#10b981 ${Math.min(100, (homeCount / homeTarget) * 100)}%, #e2e8f0 0%)`
                }}
              >
                <div className="w-full h-full rounded-full bg-[#fbf9f2] flex items-center justify-center p-2">
                  <button
                    type="button"
                    onClick={(e) => handleTap('home', e)}
                    className="relative overflow-hidden w-[144px] h-[144px] rounded-full bg-linear-to-b from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.97] transition-all flex items-center justify-center text-white font-extrabold cursor-pointer shadow-md select-none"
                  >
                    <span
                      className="relative z-10 font-bold tabular-nums"
                      style={{
                        fontSize: String(homeCount).length >= 5 ? '32px' : String(homeCount).length === 4 ? '42px' : '52px'
                      }}
                    >
                      {homeCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tombol Samping Kanan: Target Hitungan */}
              <button
                type="button"
                onClick={() => {
                  setTargetDialogScope('home');
                  setTargetInputValue(String(homeTarget));
                  setTargetDialogError('');
                  setIsTargetDialogOpen(true);
                }}
                className="absolute left-[calc(75%+54px)] top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white text-emerald-800 border border-slate-200/90 font-bold text-sm flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 tabular-nums transition-colors"
                title="Ubah Target Hitungan"
              >
                {homeTarget}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. LIST SCREEN (DAFTAR KOLEKSI DZIKIR) ================= */}
      {currentScreen === 'list' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="bg-[#4f9a50] text-white flex items-center justify-between px-3 h-14 shrink-0 shadow-sm z-20">
            <button
              type="button"
              onClick={() => setCurrentScreen('home')}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide truncate px-2 text-center flex-1">
              {activeCategory.name}
            </h1>
            <div className="w-10 h-10" />
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
            {activeCategory.cols.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => openCollection(col)}
                className="w-full flex items-center justify-between p-4.5 rounded-2xl bg-[#fcfaf5] hover:bg-emerald-50/70 text-left border border-amber-900/15 active:scale-[0.99] transition-all cursor-pointer shadow-2xs group"
              >
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-sm sm:text-base">{col.title}</h3>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">{col.items.length} bacaan dzikir</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================= 3. VIEWER SCREEN (LAYAR BACAAN DZIKIR + TASBIH TERINTEGRASI) ================= */}
      {currentScreen === 'viewer' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Bar */}
          <header className="bg-[#4f9a50] text-white relative flex items-center justify-between h-14 px-3 shrink-0 shadow-sm z-30">
            <button
              type="button"
              onClick={() => {
                stopSpeech();
                if (activeCategory.cols.length > 1) {
                  setCurrentScreen('list');
                } else {
                  setCurrentScreen('home');
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide truncate px-2 text-center flex-1">
              {activeCollection.title}
            </h1>

            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/20 active:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
              title="Menu Pengaturan Teks"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Floating More Menu */}
            {isMoreMenuOpen && (
              <div className="absolute right-3 top-14 z-50 min-w-[210px] bg-[#fffefc] rounded-2xl p-2 shadow-2xl border border-amber-900/15 animate-in fade-in space-y-1 text-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setArabicFontSize((prev) => Math.min(44, prev + 2));
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl cursor-pointer"
                >
                  Perbesar teks Arab (+2px)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setArabicFontSize((prev) => Math.max(20, prev - 2));
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl cursor-pointer"
                >
                  Perkecil teks Arab (-2px)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLatin(!showLatin);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl cursor-pointer"
                >
                  {showLatin ? 'Sembunyikan teks latin' : 'Tampilkan teks latin'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTerjemah(!showTerjemah);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 rounded-xl cursor-pointer"
                >
                  {showTerjemah ? 'Sembunyikan terjemahan' : 'Tampilkan terjemahan'}
                </button>
              </div>
            )}
          </header>

          <div className="flex-1 flex flex-col h-full overflow-hidden p-4 pb-2">
            {/* Card Body Reading Container: Latar & Halaman Dzikir Serasi Al-Qur'an (#fbf9f2) */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#fcfaf5] rounded-2xl overflow-hidden border border-amber-900/15 my-2 shadow-2xs">
              {/* Card Title */}
              <h2 className="shrink-0 m-0 px-4 py-3 bg-[#f5efe0] text-[#1b6837] font-bold text-sm sm:text-base text-center border-b border-amber-900/15">
                {currentItem.t}
              </h2>

              {/* Scrollable Reading Text */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 select-text bg-[#fcfaf5]">
                {/* Teks Arab dengan Ornamen Nomor Ayat */}
                <p
                  className="font-arabic text-right leading-[2.4] text-slate-900"
                  dir="rtl"
                  style={{
                    fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
                    fontSize: `${arabicFontSize}px`
                  }}
                  dangerouslySetInnerHTML={{
                    __html: currentItem.ar.replace(
                      /\[([٠-٩]+)\]/g,
                      "<span class='inline-flex items-center justify-center w-7 h-7 mx-1 border border-amber-700/50 rounded-full text-xs font-sans text-amber-900 font-bold align-middle bg-amber-100/50'>$1</span>"
                    )
                  }}
                />

                {/* Teks Latin */}
                {showLatin && currentItem.la && (
                  <p className="italic text-xs sm:text-sm text-emerald-950/90 leading-relaxed font-medium pt-2 border-t border-amber-900/10">
                    {currentItem.la}
                  </p>
                )}

                {/* Terjemahan Bahasa Indonesia */}
                {showTerjemah && currentItem.id && (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal pt-2 border-t border-amber-900/10">
                    {currentItem.id}
                  </p>
                )}
              </div>

              {/* Card Action Buttons Bar */}
              <div className="shrink-0 flex items-center gap-2.5 px-3 py-2.5 bg-[#f5efe0] border-t border-amber-900/15">
                <button
                  type="button"
                  onClick={toggleSpeech}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    isPlayingAudio ? 'bg-emerald-700 text-white shadow-xs' : 'bg-[#fffefc] border border-amber-900/20 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-2xs'
                  }`}
                  title={isPlayingAudio ? 'Hentikan Audio' : 'Putar Audio'}
                >
                  {isPlayingAudio ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-[#fffefc] border border-amber-900/20 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title="Bagikan Bacaan"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-10 h-10 rounded-full bg-[#fffefc] border border-amber-900/20 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                  title="Salin Teks"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowCounterInViewer(!showCounterInViewer)}
                  className={`ml-auto px-3.5 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer text-xs font-bold ${
                    showCounterInViewer ? 'bg-emerald-700 text-white shadow-xs' : 'bg-[#fffefc] border border-amber-900/20 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 shadow-2xs'
                  }`}
                  title="Sembunyikan / Tampilkan Tasbih"
                >
                  TASBIH
                </button>
              </div>
            </div>

            {/* Integrated Tasbih Counter in Reading View */}
            {showCounterInViewer && (
              <div className="shrink-0 flex flex-col items-center py-2">
                <div className="relative w-full h-[154px] flex items-center justify-center">
                  {/* Reset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setViewerCount(0);
                      triggerVibrate(60);
                    }}
                    className="absolute left-[calc(25%-50px)] top-[calc(50%+24px)] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#fffefc] text-emerald-800 border border-amber-900/20 flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 transition-colors"
                    title="Atur Ulang"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Settings button */}
                  <button
                    type="button"
                    onClick={() => setIsCfgDialogOpen(true)}
                    className="absolute left-[calc(25%-50px)] top-[calc(50%-24px)] -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-emerald-800 border border-slate-200 flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 transition-colors"
                    title="Pengaturan"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Ring & Tap Button */}
                  <div
                    className="w-[148px] h-[148px] rounded-full p-[3px] flex items-center justify-center shadow-sm bg-white border border-slate-200/70"
                    style={{
                      background: `conic-gradient(#10b981 ${Math.min(100, (viewerCount / viewerTarget) * 100)}%, #e2e8f0 0%)`
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-[#fbf9f2] flex items-center justify-center p-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleTap('viewer', e)}
                        className="relative overflow-hidden w-[124px] h-[124px] rounded-full bg-linear-to-b from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.97] transition-all flex items-center justify-center text-white font-extrabold cursor-pointer shadow-md select-none"
                      >
                        <span
                          className="relative z-10 font-bold tabular-nums"
                          style={{
                            fontSize: String(viewerCount).length >= 5 ? '26px' : String(viewerCount).length === 4 ? '34px' : '44px'
                          }}
                        >
                          {viewerCount}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Target button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetDialogScope('viewer');
                      setTargetInputValue(String(viewerTarget));
                      setTargetDialogError('');
                      setIsTargetDialogOpen(true);
                    }}
                    className="absolute left-[calc(75%+50px)] top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-emerald-800 border border-slate-200 font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 hover:bg-emerald-50 cursor-pointer z-10 tabular-nums transition-colors"
                    title="Ubah Target"
                  >
                    {viewerTarget}
                  </button>
                </div>
              </div>
            )}

            {/* Pager: Previous / Count / Next */}
            {activeCollection.items.length > 1 && (
              <div className="shrink-0 flex items-center justify-between h-12 px-2 border-t border-slate-200/70 select-none">
                <button
                  type="button"
                  disabled={activeItemIndex === 0}
                  onClick={() => goToItem(activeItemIndex - 1)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200/60 active:bg-slate-300/60 transition-colors cursor-pointer ${
                    activeItemIndex === 0 ? 'invisible pointer-events-none' : ''
                  }`}
                  title="Dzikir Sebelumnya"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <span className="font-bold text-sm sm:text-base text-slate-800 tabular-nums tracking-wide">
                  {activeItemIndex + 1} / {activeCollection.items.length}
                </span>

                <button
                  type="button"
                  disabled={activeItemIndex === activeCollection.items.length - 1}
                  onClick={() => goToItem(activeItemIndex + 1)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-200/60 active:bg-slate-300/60 transition-colors cursor-pointer ${
                    activeItemIndex === activeCollection.items.length - 1 ? 'invisible pointer-events-none' : ''
                  }`}
                  title="Dzikir Berikutnya"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL DIALOG UBAH TARGET HITUNGAN ================= */}
      {isTargetDialogOpen && (
        <div
          className="fixed inset-0 z-[100060] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsTargetDialogOpen(false)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 px-5 pt-5 pb-3">
              Masukan Jumlah Dzikir
            </h2>

            <div className="px-5 space-y-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={targetInputValue}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^0-9]/g, '');
                  setTargetInputValue(cleaned);
                  setTargetDialogError('');
                }}
                placeholder="Target hitungan..."
                className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-lg font-bold placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#4f9a50]"
                autoFocus
              />

              {targetDialogError && (
                <p className="text-xs text-rose-600 font-medium">{targetDialogError}</p>
              )}

              {/* Quick Target Chips */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[3, 33, 100, 1000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setTargetInputValue(String(v));
                      setTargetDialogError('');
                    }}
                    className="h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 active:scale-95 text-emerald-900 font-bold text-sm transition-all cursor-pointer"
                  >
                    {v}x
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsTargetDialogOpen(false)}
                className="h-12 text-sm font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(targetInputValue, 10);
                  if (!(val >= 1 && val <= 100000)) {
                    setTargetDialogError('Masukkan angka 1 sampai 100000');
                    return;
                  }
                  if (targetDialogScope === 'home') {
                    setHomeTarget(val);
                    if (homeCount >= val) setHomeCount(0);
                  } else {
                    setViewerTarget(val);
                    if (viewerCount >= val) setViewerCount(0);
                  }
                  showToast(`Target diubah menjadi ${val}x`);
                  setIsTargetDialogOpen(false);
                }}
                className="h-12 text-sm font-bold text-emerald-700 border-l border-slate-100 hover:bg-emerald-50 active:bg-emerald-100 transition-colors cursor-pointer"
              >
                SIMPAN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DIALOG PENGATURAN TASBIH ================= */}
      {isCfgDialogOpen && (
        <div
          className="fixed inset-0 z-[100060] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsCfgDialogOpen(false)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base sm:text-lg font-bold text-slate-900 px-5 pt-5 pb-2">
              Pengaturan Tasbih
            </h2>

            <div className="px-5 py-2 space-y-4">
              {/* Group 1: Saat Klik */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  Saat Klik
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      Getar
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !cfg.vibTap;
                        saveCfg({ ...cfg, vibTap: next });
                        if (next) triggerVibrate(110);
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        cfg.vibTap ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      Suara
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !cfg.sndTap;
                        saveCfg({ ...cfg, sndTap: next });
                        if (next) playBeep(880, 0.07, 0.25);
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        cfg.sndTap ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Group 2: Saat Target Tercapai */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  Saat Target Tercapai
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-slate-500" />
                      Getar
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !cfg.vibDone;
                        saveCfg({ ...cfg, vibDone: next });
                        if (next) triggerVibrate([240, 120, 240, 120, 440]);
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        cfg.vibDone ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-slate-500" />
                      Suara
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !cfg.sndDone;
                        saveCfg({ ...cfg, sndDone: next });
                        if (next) playChime();
                      }}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                        cfg.sndDone ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                      }`}
                    >
                      <span className="w-5 h-5 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setIsCfgDialogOpen(false)}
                className="w-full h-12 text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING TOAST NOTIFICATION ================= */}
      {toastMessage && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-[100070] bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-2 pointer-events-none text-center max-w-[90vw]">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
