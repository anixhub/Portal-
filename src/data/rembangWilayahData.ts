// Data resmi Kabupaten Rembang (14 Kecamatan & Desa Lengkap)
export interface WilayahBasicItem {
  id: string;
  name: string;
}

export const REMBANG_REGENCY: WilayahBasicItem = {
  id: "3317",
  name: "KABUPATEN REMBANG"
};

export const REMBANG_DISTRICTS: WilayahBasicItem[] = [
  {
    "id": "3317010",
    "name": "SUMBER"
  },
  {
    "id": "3317020",
    "name": "BULU"
  },
  {
    "id": "3317030",
    "name": "GUNEM"
  },
  {
    "id": "3317040",
    "name": "SALE"
  },
  {
    "id": "3317050",
    "name": "SARANG"
  },
  {
    "id": "3317060",
    "name": "SEDAN"
  },
  {
    "id": "3317070",
    "name": "PAMOTAN"
  },
  {
    "id": "3317080",
    "name": "SULANG"
  },
  {
    "id": "3317090",
    "name": "KALIORI"
  },
  {
    "id": "3317100",
    "name": "REMBANG"
  },
  {
    "id": "3317110",
    "name": "PANCUR"
  },
  {
    "id": "3317120",
    "name": "KRAGAN"
  },
  {
    "id": "3317130",
    "name": "SLUKE"
  },
  {
    "id": "3317140",
    "name": "LASEM"
  }
];

export const REMBANG_VILLAGES_BY_DISTRICT: Record<string, WilayahBasicItem[]> = {
  "3317010": [
    {
      "id": "3317010015",
      "name": "BOGOREJO"
    },
    {
      "id": "3317010011",
      "name": "GRAWAN"
    },
    {
      "id": "3317010010",
      "name": "JADI"
    },
    {
      "id": "3317010007",
      "name": "JATIHADI"
    },
    {
      "id": "3317010017",
      "name": "KEDUNGASEM"
    },
    {
      "id": "3317010006",
      "name": "KEDUNGTULUP"
    },
    {
      "id": "3317010005",
      "name": "KRIKILAN"
    },
    {
      "id": "3317010002",
      "name": "LOGEDE"
    },
    {
      "id": "3317010004",
      "name": "LOGUNG"
    },
    {
      "id": "3317010016",
      "name": "MEGULUNG"
    },
    {
      "id": "3317010003",
      "name": "PELEMSARI"
    },
    {
      "id": "3317010008",
      "name": "POLBAYEM"
    },
    {
      "id": "3317010012",
      "name": "RANDUAGUNG"
    },
    {
      "id": "3317010001",
      "name": "RONGGOMULYO"
    },
    {
      "id": "3317010018",
      "name": "SEKARSARI"
    },
    {
      "id": "3317010013",
      "name": "SUKOREJO"
    },
    {
      "id": "3317010009",
      "name": "SUMBER"
    },
    {
      "id": "3317010014",
      "name": "TLOGOTUNGGAL"
    }
  ],
  "3317020": [
    {
      "id": "3317020001",
      "name": "MLATIREJO"
    },
    {
      "id": "3317020002",
      "name": "SENDANGMULYO"
    },
    {
      "id": "3317020003",
      "name": "PONDOKREJO"
    },
    {
      "id": "3317020004",
      "name": "WARUGUNUNG"
    },
    {
      "id": "3317020005",
      "name": "PINGGAN"
    },
    {
      "id": "3317020006",
      "name": "CABEAN"
    },
    {
      "id": "3317020007",
      "name": "LAMBANGAN KULON"
    },
    {
      "id": "3317020008",
      "name": "LAMBANGAN WETAN"
    },
    {
      "id": "3317020009",
      "name": "SUMBERMULYO"
    },
    {
      "id": "3317020010",
      "name": "KARANGASEM"
    },
    {
      "id": "3317020011",
      "name": "PASEDAN"
    },
    {
      "id": "3317020012",
      "name": "NGULAAN"
    },
    {
      "id": "3317020015",
      "name": "MANTINGAN"
    },
    {
      "id": "3317020016",
      "name": "KADIWONO"
    }
  ],
  "3317030": [
    {
      "id": "3317030001",
      "name": "KAJAR"
    },
    {
      "id": "3317030002",
      "name": "TIMBRANGAN"
    },
    {
      "id": "3317030003",
      "name": "TEGALDOWO"
    },
    {
      "id": "3317030004",
      "name": "PASUCEN"
    },
    {
      "id": "3317030005",
      "name": "SUNTRI"
    },
    {
      "id": "3317030006",
      "name": "DOWAN"
    },
    {
      "id": "3317030009",
      "name": "KULUTAN"
    },
    {
      "id": "3317030010",
      "name": "SIDOMULYO"
    },
    {
      "id": "3317030011",
      "name": "TELGAWAH"
    },
    {
      "id": "3317030012",
      "name": "SENDANGMULYO"
    },
    {
      "id": "3317030013",
      "name": "PANOHAN"
    },
    {
      "id": "3317030014",
      "name": "DEMAAN"
    },
    {
      "id": "3317030015",
      "name": "BANYUURIP"
    },
    {
      "id": "3317030016",
      "name": "SAMBONGPAYAK"
    }
  ],
  "3317040": [
    {
      "id": "3317040001",
      "name": "TAHUNAN"
    },
    {
      "id": "3317040002",
      "name": "NGAJARAN"
    },
    {
      "id": "3317040003",
      "name": "MRAYUN"
    },
    {
      "id": "3317040004",
      "name": "BANCANG"
    },
    {
      "id": "3317040005",
      "name": "SALE"
    },
    {
      "id": "3317040006",
      "name": "JOHO"
    },
    {
      "id": "3317040007",
      "name": "JINANTEN"
    },
    {
      "id": "3317040008",
      "name": "GADING"
    },
    {
      "id": "3317040009",
      "name": "WONOKERTO"
    },
    {
      "id": "3317040010",
      "name": "SUMBERMULYO"
    },
    {
      "id": "3317040012",
      "name": "BITINGAN"
    },
    {
      "id": "3317040013",
      "name": "PAKIS"
    },
    {
      "id": "3317040014",
      "name": "UKIR"
    }
  ],
  "3317050": [
    {
      "id": "3317050001",
      "name": "LODAN KULON"
    },
    {
      "id": "3317050002",
      "name": "LODAN WETAN"
    },
    {
      "id": "3317050003",
      "name": "BONJOR"
    },
    {
      "id": "3317050004",
      "name": "TAWANGREJO"
    },
    {
      "id": "3317050005",
      "name": "SAMPUNG"
    },
    {
      "id": "3317050006",
      "name": "BATURNO"
    },
    {
      "id": "3317050007",
      "name": "BABAKTULUNG"
    },
    {
      "id": "3317050008",
      "name": "NGLOJO"
    },
    {
      "id": "3317050009",
      "name": "JAMBANGAN"
    },
    {
      "id": "3317050010",
      "name": "PELANG"
    },
    {
      "id": "3317050011",
      "name": "GILIS"
    },
    {
      "id": "3317050012",
      "name": "GUNUNGMULYO"
    },
    {
      "id": "3317050013",
      "name": "GONGGANG"
    },
    {
      "id": "3317050014",
      "name": "SUMBERMULYO"
    },
    {
      "id": "3317050015",
      "name": "KALIPANG"
    },
    {
      "id": "3317050016",
      "name": "DADAPMULYO"
    },
    {
      "id": "3317050017",
      "name": "SENDANGMULYO"
    },
    {
      "id": "3317050018",
      "name": "BANOWAN"
    },
    {
      "id": "3317050019",
      "name": "TEMPERAK"
    },
    {
      "id": "3317050020",
      "name": "KARANGMANGU"
    },
    {
      "id": "3317050021",
      "name": "BAJINGJOWO"
    },
    {
      "id": "3317050022",
      "name": "BAJINGMEDURO"
    },
    {
      "id": "3317050023",
      "name": "SARANGMEDURO"
    }
  ],
  "3317060": [
    {
      "id": "3317060001",
      "name": "NGULAHAN"
    },
    {
      "id": "3317060002",
      "name": "PACING"
    },
    {
      "id": "3317060003",
      "name": "KARAS"
    },
    {
      "id": "3317060004",
      "name": "MOJOSARI"
    },
    {
      "id": "3317060005",
      "name": "GESIKAN"
    },
    {
      "id": "3317060006",
      "name": "SAMBIROTO"
    },
    {
      "id": "3317060007",
      "name": "SEDAN"
    },
    {
      "id": "3317060008",
      "name": "KARANGASEM"
    },
    {
      "id": "3317060009",
      "name": "SIDOREJO"
    },
    {
      "id": "3317060010",
      "name": "SIDOMULYO"
    },
    {
      "id": "3317060011",
      "name": "KEDUNGRINGIN"
    },
    {
      "id": "3317060012",
      "name": "GANDRIROJO"
    },
    {
      "id": "3317060013",
      "name": "CANDIMULYO"
    },
    {
      "id": "3317060014",
      "name": "LEMAHPUTIH"
    },
    {
      "id": "3317060015",
      "name": "KUMBO"
    },
    {
      "id": "3317060016",
      "name": "DADAPAN"
    },
    {
      "id": "3317060017",
      "name": "SAMBONG"
    },
    {
      "id": "3317060018",
      "name": "BOGOREJO"
    },
    {
      "id": "3317060019",
      "name": "KENONGO"
    },
    {
      "id": "3317060020",
      "name": "JAMBEYAN"
    },
    {
      "id": "3317060021",
      "name": "MENORO"
    }
  ],
  "3317070": [
    {
      "id": "3317070001",
      "name": "MEGAL"
    },
    {
      "id": "3317070002",
      "name": "NGEMPLAKREJO"
    },
    {
      "id": "3317070003",
      "name": "PRAGEN"
    },
    {
      "id": "3317070004",
      "name": "SAMARAN"
    },
    {
      "id": "3317070005",
      "name": "GAMBIRAN"
    },
    {
      "id": "3317070006",
      "name": "BAMBAN"
    },
    {
      "id": "3317070007",
      "name": "BANGUNREJO"
    },
    {
      "id": "3317070008",
      "name": "PAMOTAN"
    },
    {
      "id": "3317070009",
      "name": "SIDOREJO"
    },
    {
      "id": "3317070010",
      "name": "TEMPALING"
    },
    {
      "id": "3317070011",
      "name": "JOHO"
    },
    {
      "id": "3317070012",
      "name": "MLAGEN"
    },
    {
      "id": "3317070013",
      "name": "KEPOHAGUNG"
    },
    {
      "id": "3317070014",
      "name": "MLAWAT"
    },
    {
      "id": "3317070015",
      "name": "SEGOROMULYO"
    },
    {
      "id": "3317070016",
      "name": "KETANGI"
    },
    {
      "id": "3317070017",
      "name": "SENDANGAGUNG"
    },
    {
      "id": "3317070018",
      "name": "GEGERSIMO"
    },
    {
      "id": "3317070019",
      "name": "SUMBANGREJO"
    },
    {
      "id": "3317070020",
      "name": "JAPEREJO"
    },
    {
      "id": "3317070022",
      "name": "RINGIN"
    },
    {
      "id": "3317070023",
      "name": "SUMBEREJO"
    }
  ],
  "3317080": [
    {
      "id": "3317080001",
      "name": "TANJUNG"
    },
    {
      "id": "3317080002",
      "name": "KEMADU"
    },
    {
      "id": "3317080003",
      "name": "SULANG"
    },
    {
      "id": "3317080004",
      "name": "POMAHAN"
    },
    {
      "id": "3317080006",
      "name": "KOROWELANG"
    },
    {
      "id": "3317080007",
      "name": "KARANGHARJO"
    },
    {
      "id": "3317080008",
      "name": "JATIMUDO"
    },
    {
      "id": "3317080009",
      "name": "KUNIR"
    },
    {
      "id": "3317080011",
      "name": "BOGORAME"
    },
    {
      "id": "3317080012",
      "name": "KALIOMBO"
    },
    {
      "id": "3317080013",
      "name": "SUDO"
    },
    {
      "id": "3317080014",
      "name": "KARANGSARI"
    },
    {
      "id": "3317080015",
      "name": "PRAGU"
    },
    {
      "id": "3317080016",
      "name": "KEBONAGUNG"
    },
    {
      "id": "3317080018",
      "name": "PRANTI"
    },
    {
      "id": "3317080019",
      "name": "PEDAK"
    },
    {
      "id": "3317080020",
      "name": "LANDOH"
    }
  ],
  "3317090": [
    {
      "id": "3317090002",
      "name": "MAGUAN"
    },
    {
      "id": "3317090003",
      "name": "SIDOMULYO"
    },
    {
      "id": "3317090004",
      "name": "WIROTO"
    },
    {
      "id": "3317090005",
      "name": "BANGGI"
    },
    {
      "id": "3317090006",
      "name": "KUANGSAN"
    },
    {
      "id": "3317090007",
      "name": "GUNUNGSARI"
    },
    {
      "id": "3317090008",
      "name": "SENDANGAGUNG"
    },
    {
      "id": "3317090009",
      "name": "KARANGSEKAR"
    },
    {
      "id": "3317090010",
      "name": "BABADAN"
    },
    {
      "id": "3317090011",
      "name": "PENGKOL"
    },
    {
      "id": "3317090012",
      "name": "SAMBIYAN"
    },
    {
      "id": "3317090013",
      "name": "MOJOREMBUN"
    },
    {
      "id": "3317090014",
      "name": "TUNGGULSARI"
    },
    {
      "id": "3317090015",
      "name": "TAMBAKAGUNG"
    },
    {
      "id": "3317090016",
      "name": "MOJOWARNO"
    },
    {
      "id": "3317090017",
      "name": "DRESI KULON"
    },
    {
      "id": "3317090018",
      "name": "DRESI WETAN"
    },
    {
      "id": "3317090019",
      "name": "TASIKHARJO"
    },
    {
      "id": "3317090020",
      "name": "PURWOREJO"
    },
    {
      "id": "3317090021",
      "name": "BOGOHARJO"
    },
    {
      "id": "3317090022",
      "name": "BANYUDONO"
    },
    {
      "id": "3317090023",
      "name": "PANTIHARJO"
    }
  ],
  "3317100": [
    {
      "id": "3317100001",
      "name": "KEDUNGREJO"
    },
    {
      "id": "3317100004",
      "name": "SRIDADI"
    },
    {
      "id": "3317100005",
      "name": "PADARAN"
    },
    {
      "id": "3317100006",
      "name": "TLOGOMOJO"
    },
    {
      "id": "3317100007",
      "name": "KASREMAN"
    },
    {
      "id": "3317100008",
      "name": "PUNJULHARJO"
    },
    {
      "id": "3317100009",
      "name": "TRITUNGGAL"
    },
    {
      "id": "3317100010",
      "name": "PASARBANGGI"
    },
    {
      "id": "3317100011",
      "name": "GEDANGAN"
    },
    {
      "id": "3317100012",
      "name": "WETON"
    },
    {
      "id": "3317100013",
      "name": "NGOTET"
    },
    {
      "id": "3317100014",
      "name": "MONDOTEKO"
    },
    {
      "id": "3317100015",
      "name": "NGADEM"
    },
    {
      "id": "3317100016",
      "name": "KETANGGI"
    },
    {
      "id": "3317100017",
      "name": "PULO"
    },
    {
      "id": "3317100018",
      "name": "WARU"
    },
    {
      "id": "3317100019",
      "name": "MAGERSARI"
    },
    {
      "id": "3317100020",
      "name": "GEGUNUNG KULON"
    },
    {
      "id": "3317100021",
      "name": "GEGUNUNG WETAN"
    },
    {
      "id": "3317100022",
      "name": "PACAR"
    },
    {
      "id": "3317100023",
      "name": "TANJUNGSARI"
    },
    {
      "id": "3317100024",
      "name": "SUMBERJO"
    },
    {
      "id": "3317100025",
      "name": "TASIKAGUNG"
    },
    {
      "id": "3317100026",
      "name": "SAWAHAN"
    },
    {
      "id": "3317100028",
      "name": "SIDOWAYAH"
    },
    {
      "id": "3317100029",
      "name": "KUTOHARJO"
    },
    {
      "id": "3317100030",
      "name": "PANDEAN"
    },
    {
      "id": "3317100031",
      "name": "SUKOHARJO"
    },
    {
      "id": "3317100032",
      "name": "KABONGAN LOR"
    },
    {
      "id": "3317100033",
      "name": "KABONGAN KIDUL"
    },
    {
      "id": "3317100034",
      "name": "TIREMAN"
    }
  ],
  "3317110": [
    {
      "id": "3317110001",
      "name": "JAPELEDOK"
    },
    {
      "id": "3317110003",
      "name": "DOROPAYUNG"
    },
    {
      "id": "3317110004",
      "name": "KARASKEPOH"
    },
    {
      "id": "3317110005",
      "name": "TUYUHAN"
    },
    {
      "id": "3317110006",
      "name": "PANDAN"
    },
    {
      "id": "3317110007",
      "name": "GEMBLENGMULYO"
    },
    {
      "id": "3317110008",
      "name": "SUMBERAGUNG"
    },
    {
      "id": "3317110009",
      "name": "KALITENGAH"
    },
    {
      "id": "3317110010",
      "name": "SIDOWAYAH"
    },
    {
      "id": "3317110012",
      "name": "PUNGGURHARJO"
    },
    {
      "id": "3317110013",
      "name": "LANGKIR"
    },
    {
      "id": "3317110014",
      "name": "PANCUR"
    },
    {
      "id": "3317110015",
      "name": "POHLANDAK"
    },
    {
      "id": "3317110016",
      "name": "WARUGUNUNG"
    },
    {
      "id": "3317110017",
      "name": "CRIWIK"
    },
    {
      "id": "3317110019",
      "name": "NGULANGAN"
    },
    {
      "id": "3317110020",
      "name": "BANYUURIP"
    },
    {
      "id": "3317110021",
      "name": "JOHOGUNUNG"
    },
    {
      "id": "3317110022",
      "name": "TRENGGULUNAN"
    },
    {
      "id": "3317110023",
      "name": "NGROTO"
    }
  ],
  "3317120": [
    {
      "id": "3317120001",
      "name": "TANJUNGSARI"
    },
    {
      "id": "3317120002",
      "name": "SENDANGMULYO"
    },
    {
      "id": "3317120003",
      "name": "SENDANGWARU"
    },
    {
      "id": "3317120004",
      "name": "NGASINAN"
    },
    {
      "id": "3317120005",
      "name": "KENDALAGUNG"
    },
    {
      "id": "3317120006",
      "name": "MOJOKERTO"
    },
    {
      "id": "3317120007",
      "name": "TANJUNGAN"
    },
    {
      "id": "3317120008",
      "name": "KEBLORAN"
    },
    {
      "id": "3317120009",
      "name": "KARANGANYAR"
    },
    {
      "id": "3317120010",
      "name": "KARANGLINCAK"
    },
    {
      "id": "3317120011",
      "name": "KARANGHARJO"
    },
    {
      "id": "3317120012",
      "name": "KRAGAN"
    },
    {
      "id": "3317120013",
      "name": "TEGALMULYO"
    },
    {
      "id": "3317120014",
      "name": "BALONGMULYO"
    },
    {
      "id": "3317120015",
      "name": "NARUKAN"
    },
    {
      "id": "3317120016",
      "name": "SUDAN"
    },
    {
      "id": "3317120017",
      "name": "TERJAN"
    },
    {
      "id": "3317120018",
      "name": "SENDANG"
    },
    {
      "id": "3317120019",
      "name": "WATUPECAH"
    },
    {
      "id": "3317120020",
      "name": "WORO"
    },
    {
      "id": "3317120022",
      "name": "PLAWANGAN"
    },
    {
      "id": "3317120023",
      "name": "SUMBERGAYAM"
    },
    {
      "id": "3317120024",
      "name": "PANDANGAN WETAN"
    },
    {
      "id": "3317120025",
      "name": "PANDANGAN KULON"
    },
    {
      "id": "3317120026",
      "name": "SUMURTAWANG"
    },
    {
      "id": "3317120027",
      "name": "SUMBERSARI"
    }
  ],
  "3317130": [
    {
      "id": "3317130001",
      "name": "SANETAN"
    },
    {
      "id": "3317130002",
      "name": "RAKITAN"
    },
    {
      "id": "3317130003",
      "name": "BENDO"
    },
    {
      "id": "3317130004",
      "name": "LABUHAN KIDUL"
    },
    {
      "id": "3317130005",
      "name": "SENDANGMULYO"
    },
    {
      "id": "3317130006",
      "name": "BLIMBING"
    },
    {
      "id": "3317130007",
      "name": "MANGGAR"
    },
    {
      "id": "3317130008",
      "name": "JATISARI"
    },
    {
      "id": "3317130009",
      "name": "LANGGAR"
    },
    {
      "id": "3317130011",
      "name": "JURANGJERO"
    },
    {
      "id": "3317130012",
      "name": "LERAN"
    },
    {
      "id": "3317130013",
      "name": "TRAHAN"
    },
    {
      "id": "3317130014",
      "name": "PANGKALAN"
    }
  ],
  "3317140": [
    {
      "id": "3317140001",
      "name": "KARASGEDE"
    },
    {
      "id": "3317140002",
      "name": "JOLOTUNDO"
    },
    {
      "id": "3317140003",
      "name": "SUMBERGIRANG"
    },
    {
      "id": "3317140004",
      "name": "KARANGTURI"
    },
    {
      "id": "3317140005",
      "name": "BABAGAN"
    },
    {
      "id": "3317140006",
      "name": "DOROKANDANG"
    },
    {
      "id": "3317140007",
      "name": "GEDONGMULYO"
    },
    {
      "id": "3317140008",
      "name": "DASUN"
    },
    {
      "id": "3317140009",
      "name": "SODITAN"
    },
    {
      "id": "3317140010",
      "name": "NGEMPLAK"
    },
    {
      "id": "3317140011",
      "name": "SELOPURO"
    },
    {
      "id": "3317140012",
      "name": "SENDANGCOYO"
    },
    {
      "id": "3317140013",
      "name": "NGARGOMULYO"
    },
    {
      "id": "3317140014",
      "name": "KAJAR"
    },
    {
      "id": "3317140015",
      "name": "GOWAK"
    },
    {
      "id": "3317140016",
      "name": "SENDANGASRI"
    },
    {
      "id": "3317140017",
      "name": "TASIKSONO"
    },
    {
      "id": "3317140018",
      "name": "SRIOMBO"
    },
    {
      "id": "3317140019",
      "name": "BONANG"
    },
    {
      "id": "3317140020",
      "name": "BINANGUN"
    }
  ]
};
