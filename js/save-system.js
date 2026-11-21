/* ==========================================================================
   ECHOES OF THE ABYSS - SAVE SYSTEM & I18N MODULE
   Handles translations, localStorage, settings, and high scores.
   ========================================================================== */
    /* ===== I18N: Bahasa Indonesia / English (disimpan di localStorage) ===== */
    (function () {
      var KEY = 'eota_lang', LANG = 'id';
      try {
        LANG = localStorage.getItem(KEY) === 'en' ? 'en' : 'id';
      } catch (e) { }
      var EX = {
        "Satu lagi!": "One more!", "Lagi!": "Again!", "Kena!": "Hit!", "Segar...": "Refreshing...", "Fokus...": "Focus...", "Tusuk!": "Thrust!", "Lurus!": "Straight!", "Bagus!": "Nice!", "✔ Bagus!": "✔ Nice!", "KEMBALI": "BACK", "Kembali": "Back", "Suara": "Sound", "gerak": "move", "lari": "run", "lanjut": "next", "tutup": "close", "Pedang": "Sword", "Tombak": "Spear", "Busur": "Bow", "Tongkat": "Staff", "Belati": "Dagger", "Tombol": "Buttons", "Latihan": "Training", "Kontrol": "Controls"
      }, PHL = [
        [
          "Kemarilah, pahlawan. Kitab Status ini menyalurkan kekuatanmu. Poin atribut hanya bisa dibagi di sini, bukan di dalam dungeon.", "Come closer, hero. This Book of Status channels your strength. Attribute points can only be spent here, not inside the dungeon."
        ], [
          "Finza bilang dagangan terbaik adalah yang membuat pelanggan pulang dengan selamat. Makanya, kuisi ulang persediaanmu. Gratis untuk pahlawan yang menjaga kita semua!", "Finza says the best merchandise is whatever gets customers home safely. So I'm restocking your supplies. Free for the hero who protects us all!"
        ], [
          "Nih, kuisi bar ULT-mu supaya bisa langsung dicoba di manekin ruang pelatihan (pintu kanan lobby). Hajar! Lagu belum selesai, jadi aku kembali berdansa dulu!", "Here, I'll fill your ULT bar so you can try it right away on the dummies in the training hall (right door of the lobby). Smash them! The song isn't over, so I'm going back to dancing!"
        ], [
          "Hei, murid baru! Aku Finza, pelatih tempur sekaligus pasangan dansa Abeth. Lihat gaunnya? Cantik, kan? Aku melatih siapa pun yang tidak takut keringat.", "Hey, new student! I'm Finza, combat trainer and Abeth's dance partner. See her dress? Pretty, right? I train anyone who isn't afraid of sweat."
        ], [
          "Pedang pusaka di dinding itu peninggalan pahlawan terdahulu. Tiap senjata punya 3 hit combo berbeda; tahan klik kiri untuk charged, Z X C untuk skill.", "The heirloom sword on the wall belonged to a hero of old. Each weapon has a different 3-hit combo; hold left click for charged, Z X C for skills."
        ], [
          "Selamat datang! Aku Abeth, pedagang keliling. Maaf ya, aku sedang berdansa dengan Finza, pasanganku. Kami selalu berdansa di lantai ini setiap sore.", "Welcome! I'm Abeth, a traveling merchant. Sorry, I'm dancing with Finza, my partner. We always dance on this floor every evening."
        ], [
          "Tahan klik kiri lalu lepas untuk serangan charged, dan Z X C untuk skill. Coba semuanya di manekin, di ruang pelatihan sebelah kanan lobby!", "Hold left click and release for a charged attack, and Z X C for skills. Try them all on the dummies in the training hall to the right of the lobby!"
        ], [
          "Inilah Camp Pelatihan. Rhea, Bram, dan yang lain berlatih di sini setiap hari. Tidak ada musuh yang menyerang, jadi jangan takut mencoba.", "This is the Training Camp. Rhea, Bram, and the others train here every day. No enemies attack here, so don't be afraid to try things."
        ], [
          "Ah, akhirnya kau sadar, pahlawan. Aku Ser Aldric, penjaga lobby ini. Sebelum turun ke Dungeon, biar kuajarkan dulu cara bertarung.", "Ah, you have finally awoken, hero. I am Ser Aldric, guardian of this lobby. Before you descend into the Dungeon, let me teach you how to fight."
        ], [
          "Setiap damage yang kau beri mengisi bar ULT di kiri atas. Bar-mu sudah kuisi penuh. Selama ultimate aktif, kau kebal serangan!", "Every point of damage you deal fills the ULT bar at the top left. I've filled your bar completely. While the ultimate is active, you are immune to attacks!"
        ], [
          "tekan R untuk minum potion (+60 HP), G untuk bicara dengan orang di sekitarmu, dan B untuk kembali ke lobby saat di dungeon.", "press R to drink a potion (+60 HP), G to talk to people around you, and B to return to the lobby from the dungeon."
        ], [
          "tombol 🧪 untuk minum potion (+60 HP), BICARA untuk menyapa orang di sekitarmu, dan LOBBY untuk pulang saat di dungeon.", "the 🧪 button to drink a potion (+60 HP), TALK to greet people around you, and LOBBY to go home from the dungeon."
        ], [
          "Untuk install di iOS Safari: tekan tombol Bagikan (Share) lalu pilih 'Add to Home Screen' (Tambah ke Layar Utama).", "To install on iOS Safari: tap the Share button, then choose 'Add to Home Screen'."
        ], [
          "Saat genting, tekan B (jika tak ada musuh dekat) untuk kembali ke lobby. Gugur pun akan membawamu pulang ke sini.", "In a pinch, press B (if no enemies are near) to return to the lobby. Falling in battle will also bring you back here."
        ], [
          "Pedang, tombak, busur, tongkat, belati: tiap senjata menyimpan ultimate yang mampu membalik jalannya pertempuran.", "Sword, spear, bow, staff, dagger: each weapon holds an ultimate that can turn the tide of battle."
        ], [
          "TONGKAT: bola sihir yang meledak, bagus lawan kerumunan. BELATI: cepat dan lincah, berputar silang di hit ketiga.", "STAFF: exploding magic orbs, great against crowds. DAGGERS: fast and agile, a crossing spin on the third hit."
        ], [
          "TOMBAK: jangkauan panjang, menembus barisan musuh. BUSUR: tembak dari jauh, tahan klik kiri untuk panah tembus.", "SPEAR: long reach, pierces enemy lines. BOW: shoot from afar, hold left click for a piercing arrow."
        ], [
          "Pedang, tombak, busur, tongkat, belati: tiap senjata punya 3 hit combo yang berbeda. Tekan 1-5 untuk berganti.", "Sword, spear, bow, staff, dagger: each weapon has a different 3-hit combo. Press 1-5 to switch."
        ], [
          "Aku akan menyebutkan kontrolnya satu per satu. Coba lakukan sesuai arahanku. Kita mulai dari serangan dasar.", "I'll go through the controls one by one. Try them as I instruct. We'll start with the basic attack."
        ], [
          "Rak di sana itu koleksi pribadiku: pedang, tombak, busur, tongkat, belati. Mau lihat? Tekan G di dekat rak.", "That rack over there is my personal collection: sword, spear, bow, staff, dagger. Want a look? Press G near the rack."
        ], [
          "Selama ultimate aktif kau kebal serangan. Tombak melempar tombak raksasa, belati menghilang seperti ninja!", "While the ultimate is active you are immune to attacks. The spear hurls a giant spear, the daggers vanish like a ninja!"
        ], [
          "Dulu para pahlawan menaklukkan lima wangsa bayangan. Kini kisah mereka tinggal catatan di arsip tua ini.", "Long ago, heroes conquered the five shadow dynasties. Now their story is only a record in this old archive."
        ], [
          "Kau punya 5 senjata dan bisa menggantinya kapan saja, bahkan di tengah pertarungan. Coba ganti dua kali!", "You have 5 weapons and can switch at any time, even mid-fight. Try switching twice!"
        ], [
          "Tahan tombol serang sampai terdengar bunyi tanda siap, lalu lepas. Lebih kuat, tapi memakan 30 stamina.", "Hold the attack button until you hear the ready sound, then release. Stronger, but costs 30 stamina."
        ], [
          "Kata Finza, pedang kayu lebih jujur dari pedang baja: tidak ada yang berdarah, tapi pelajarannya sama.", "Finza says a wooden sword is more honest than a steel one: nobody bleeds, but the lesson is the same."
        ], [
          "Sebelum kau pergi... mau kuulangi latihan dasarnya dari awal? Aku tidak keberatan mengajarimu lagi.", "Before you go... shall I repeat the basic training from the start? I don't mind teaching you again."
        ], [
          "Pedang pusaka di dinding itu? Konon ia memilih pemiliknya, bukan sebaliknya. Mungkin ia memilihmu.", "The heirloom sword on the wall? They say it chooses its owner, not the other way around. Maybe it has chosen you."
        ], [
          "Selamat datang di Lobby. Bicara dengan NPC [G], latihan di ruang kanan, lalu masuk gerbang utara.", "Welcome to the Lobby. Talk to NPCs with [G], train in the room to the right, then enter the north gate."
        ], [
          "Gerbang di utara menuju Dungeon. Habiskan 5 gelombang untuk membuka pintu ke ruangan berikutnya.", "The gate to the north leads to the Dungeon. Clear 5 waves to open the door to the next room."
        ], [
          "Berguling menghindari serangan musuh. Kau kebal sesaat saat berguling, tapi memakan 25 stamina.", "Roll to dodge enemy attacks. You are briefly invulnerable while rolling, but it costs 25 stamina."
        ], [
          "Kalau kau sudah hafal semua kontrolnya, tekan LEWATI di atas layar kapan saja. Ayo, ikuti aku!", "If you already know all the controls, press SKIP at the top of the screen at any time. Come on, follow me!"
        ], [
          "Combo tiga serangan: yang kedua lebih cepat, yang ketiga paling kuat. Jangan putus rantainya.", "Three-hit combo: the second is faster, the third is the strongest. Don't break the chain."
        ], [
          "Aku isi bar ULT-mu. Cobalah di manekin arena, lalu kembali ke lobby dan masuki gerbang utara.", "I'll fill your ULT bar. Try it on the arena dummies, then go back to the lobby and enter the north gate."
        ], [
          "Baik, kita ulangi dari awal. Ikuti aku ke Camp Pelatihan lagi. Tekan LEWATI jika sudah cukup.", "Alright, let's start over. Follow me to the Training Camp again. Press SKIP when you've had enough."
        ], [
          "Tahan klik kiri lalu lepas untuk panah charged: makin lama ditarik, makin kuat tembusannya.", "Hold left click and release for a charged arrow: the longer you draw, the stronger the pierce."
        ], [
          "Ramuan memulihkan 60 HP. Tekan R saat bertarung, dan musuh kadang menjatuhkan ramuan baru.", "Potions restore 60 HP. Press R during battle, and enemies sometimes drop new potions."
        ], [
          "PEDANG: seimbang dan serbaguna. Tebasan kiri lalu kanan, dan hantaman besar di hit ketiga.", "SWORD: balanced and versatile. A left slash, then a right, and a heavy blow on the third hit."
        ], [
          "Ayunkan senjatamu! Tiga serangan beruntun membentuk combo, dan hit ketiga paling kuat.", "Swing your weapon! Three attacks in a row form a combo, and the third hit is the strongest."
        ], [
          "Poin atribut dari level up dibagi lewat Kitab Status milik Ketua Orin di lobby. Berhati-hatilah, pahlawan.", "Attribute points from leveling up are spent in Elder Orin's Book of Status in the lobby. Be careful, hero."
        ], [
          "Tongkat menembakkan bola sihir yang meledak. Paling efektif kalau musuh berkelompok!", "The staff fires exploding magic orbs. Most effective when enemies are grouped up!"
        ], [
          "Rak senjata pribadiku! Lima senjata, lima gaya bertarung. Semuanya kutempa sendiri.", "My personal weapon rack! Five weapons, five fighting styles. I forged every one myself."
        ], [
          "Manekin tidak membalas, tetapi musuh di dungeon akan. Latih dodge-mu dengan Space.", "Dummies don't hit back, but the enemies in the dungeon will. Practice your dodge with Space."
        ], [
          "Kalau mau ikut latihan, hajar manekin di arena tengah. DPS-mu muncul di bawahnya.", "If you want to train, smash the dummies in the middle arena. Your DPS shows up below them."
        ], [
          "Tombak menjangkau lebih jauh dari pedang. Biarkan musuh tak pernah menyentuhmu.", "A spear reaches farther than a sword. Never let the enemy touch you."
        ], [
          "Aduh... punggungku... Garran menyuruh kami lari sepuluh putaran keliling arena.", "Ouch... my back... Garran made us run ten laps around the arena."
        ], [
          "Fokus tempur membakar semangatmu 10 detik. Pedang, tombak, belati: serang lebih cepat, damage +50%, lari kencang. Busur, tongkat: lari kencang & pertahanan naik. Cooldown 30 detik.", "Battle Focus sets your spirit ablaze for 10 seconds. Sword, spear, daggers: faster attacks, +50% damage, faster running. Bow, staff: faster running and higher defense. Cooldown 30 seconds."
        ], [
          "Manekin latihan ada di arena sebelah timur. Gerbang utara lobby menuju Dungeon.", "Training dummies are in the arena to the east. The lobby's north gate leads to the Dungeon."
        ], [
          "Ruang Pelatihan — serang manekin untuk uji DPS. Pintu kiri = kembali ke lobby.", "Training Hall — attack the dummies to test your DPS. Left door = back to the lobby."
        ], [
          "Kau mendengar gema itu? Abyss belum tidur. Ia hanya menunggu orang-orang lupa.", "Do you hear that echo? The Abyss hasn't gone to sleep. It is only waiting for people to forget."
        ], [
          "Setiap damage yang kau beri mengisi bar ULT di kiri atas. Saat penuh, tekan Q!", "Every point of damage you deal fills the ULT bar at the top left. When it's full, press Q!"
        ], [
          "Setiap senjata punya 3 skill dengan cooldown masing-masing. Pakai ketiganya!", "Each weapon has 3 skills with their own cooldowns. Use all three!"
        ], [
          "Gelombang 5 selesai! Pintu di kanan terbuka — masuk ke ruangan berikutnya.", "Wave 5 cleared! The door on the right is open — enter the next room."
        ], [
          "Sihir itu soal fokus, bukan teriakan. Meski... teriakan kadang membantu.", "Magic is about focus, not shouting. Although... shouting sometimes helps."
        ], [
          "Hngh... tujuh puluh... tujuh puluh satu! Otot adalah baju zirah terbaik!", "Hngh... seventy... seventy-one! Muscle is the best armor!"
        ], [
          "Tarik napas, tahan, lepaskan. Memanah itu soal kesabaran, bukan tenaga.", "Breathe in, hold, release. Archery is about patience, not strength."
        ], [
          "Tempat ini dilindungi cahaya. Tidak ada makhluk Abyss yang bisa masuk.", "This place is protected by light. No creature of the Abyss can enter."
        ], [
          "Heh, akhirnya bangun juga! Senjatamu kelihatan tua, tapi masih tajam.", "Heh, you're finally up! Your weapon looks old, but it's still sharp."
        ], [
          "Tambahkan poin atribut ke STR kalau mau pukulanmu seperti palu godam.", "Put attribute points into STR if you want your hits to land like a sledgehammer."
        ], [
          "Perhatian, rekrut! Di camp ini tidak ada yang namanya terlalu lelah!", "Attention, recruits! In this camp there is no such thing as too tired!"
        ], [
          "Hah! Jangan lengah, Bram! Kita sparring sampai salah satu menyerah.", "Hah! Don't let your guard down, Bram! We spar until one of us gives up."
        ], [
          "Duduk dekat api unggun ini satu-satunya yang membuatku tetap hidup.", "Sitting by this campfire is the only thing keeping me alive."
        ], [
          "Tiap senjata punya gaya serang, skill, dan ultimate yang berbeda.", "Each weapon has a different attack style, skills, and ultimate."
        ], [
          "Tusukan lurus menembus beberapa musuh sekaligus. Atur jaraknya!", "A straight thrust pierces several enemies at once. Mind your distance!"
        ], [
          "Tahan & geser tombol ATK untuk membidik, lepas untuk menyerang.", "Hold and drag the ATK button to aim, release to attack."
        ], [
          "Rhea itu cepat sekali... tapi tadi aku hampir menang. Hampir.", "Rhea is so fast... but I almost won just now. Almost."
        ], [
          "Seribu tebasan sehari. Itu rahasiaku. Tidak ada jalan pintas.", "A thousand slashes a day. That's my secret. There are no shortcuts."
        ], [
          "Memasuki Dungeon — Gelombang 1 dimulai! [B] kembali ke lobby", "Entering the Dungeon — Wave 1 begins! [B] return to lobby"
        ], [
          "Biarkan aku memulihkanmu sebelum kau pergi bertarung lagi...", "Let me heal you before you go off to fight again..."
        ], [
          " Lupa kontrolnya? Tekan T di lobby untuk mengulang latihan.", " Forgot the controls? Press T in the lobby to repeat the training."
        ], ["Lobby — Zona Aman. Tidak ada musuh yang menyerang di sini.", "Lobby — Safe Zone. No enemies attack here."], [
          "Ruangan Bos — Morvath menunggumu. Tidak ada jalan kembali!", "Boss Chamber — Morvath awaits you. There is no way back!"
        ], [
          "Checkpoint dimuat — HP pulih penuh. Lawan Morvath kembali!", "Checkpoint loaded — HP fully restored. Face Morvath again!"
        ], [
          "Stamina terisi kembali otomatis jika sedang tidak dipakai.", "Stamina refills automatically when not in use."
        ], [
          "Ikuti Ser Aldric ke Camp Pelatihan di sebelah timur lobby.", "Follow Ser Aldric to the Training Camp east of the lobby."
        ], [
          "Ganti senjata (tombol 1 – 5) untuk mencoba skill lainnya.", "Switch weapons (buttons 1 – 5) to try other skills."
        ], [
          "Ganti senjata (1 – 5) untuk mencoba skill senjata lain.", "Switch weapons (1 – 5) to try other weapons' skills."
        ], ["Ikuti aku ke Camp Pelatihan di sebelah timur lobby. ", "Follow me to the Training Camp east of the lobby. "], ["Berjalanlah dengan WASD, tahan Shift untuk berlari.", "Walk with WASD, hold Shift to run."], [" Tekan L kapan saja untuk membuka panduan kontrol.", " Press L at any time to open the controls guide."], ["Tahan klik kiri lalu lepas : charged (30 stamina)", "Hold left click, then release : charged (30 stamina)"], ["Dekati Ser Aldric agar ia melanjutkan perjalanan.", "Get close to Ser Aldric so he can continue."], ["Bagus sekali, kau cepat belajar! Tiga hal lagi: ", "Well done, you learn fast! Three more things: "], ["Tanpa arah gerak, kau berguling ke arah kursor.", "With no movement input, you roll toward the cursor."], ["Latihan selesai! Semoga beruntung di Dungeon.", "Training complete! Good luck in the Dungeon."], ["Kau gugur. Kembali ke checkpoint terakhir...", "You have fallen. Returning to the last checkpoint..."], ["Area bersih! Gelombang berikutnya datang...", "Area clear! The next wave is coming..."], ["Musuh terlalu dekat untuk kembali ke lobby!", "Enemies are too close to return to the lobby!"], ["Kau akan segera ditarik kembali ke lobby...", "You will soon be pulled back to the lobby..."], ["Aktifkan sebelum menyerang musuh yang kuat.", "Activate it before attacking a strong enemy."], ["Setiap senjata punya ultimate yang berbeda.", "Each weapon has a different ultimate."], ["[L] Kontrol   [F] Layar penuh   [M] Suara ", "[L] Controls   [F] Fullscreen   [M] Sound "], ["♪ KLIK DI MANA SAJA UNTUK MENYALAKAN SUARA", "♪ CLICK ANYWHERE TO ENABLE SOUND"], ["PANDUAN KONTROL  (tekan L untuk menutup)", "CONTROLS GUIDE  (press L to close)"], ["Klik kiri : serangan basic (chain combo)", "Left click : basic attack (chain combo)"], ["Poin atribut dari level up dibagi lewat ", "Attribute points from leveling up are spent with "], [" selesai! Pintu BOS di kanan terbuka...", " cleared! The BOSS door on the right is open..."], ["Q : ULTIMATE (aktif saat bar ULT penuh)", "Q : ULTIMATE (when the ULT bar is full)"], ["6 7 8 9 0 : tambah VIT STR DEF AGI INT", "6 7 8 9 0 : add VIT STR DEF AGI INT"], ["Fase 2 — Morvath memanggil pasukannya!", "Phase 2 — Morvath summons his army!"], ["Gerakkan joystick kiri untuk berjalan.", "Move the left joystick to walk."], ["tombol 6 – 0 (VIT, STR, DEF, AGI, INT)", "keys 6 – 0 (VIT, STR, DEF, AGI, INT)"], ["Ruangan 2: Torch Dungeon — Gelombang ", "Room 2: Torch Dungeon — Wave "], ["Arahkan serangan dengan kursor mouse.", "Aim your attacks with the mouse cursor."], ["Dekati Ser Aldric untuk melanjutkan.", "Get close to Ser Aldric to continue."], ["Tidak ada jalan kabur dari Morvath!", "There is no escaping Morvath!"], ["Jangan hanya lengan, pakai kakimu!", "Don't just use your arms, use your legs!"], [" Tekan T di lobby untuk mengulang.", " Press T in the lobby to repeat."], ["Satu lagi, Gorm! Jangan menyerah!", "One more, Gorm! Don't give up!"], ["Jangan berdiri dekat-dekat, ya.", "Don't stand too close, okay?"], ["poin atribut (tekan 6 7 8 9 0)", "attribute points (press 6 7 8 9 0)"], ["B : kembali ke lobby (dungeon)", "B : return to lobby (dungeon)"], ["Terima kasih telah mengunjungi", "Thank you for visiting"], ["L : tampilkan / tutup panduan", "L : show / hide guide"], ["G : bicara dengan NPC (lobby)", "G : talk to NPCs (lobby)"], ["Ditarik keluar dari ruang bos", "Pulled out of the boss chamber"], ["WASD  : gerak,  Shift : lari", "WASD  : move,  Shift : run"], ["Z X C : 3 skill tiap senjata", "Z X C : 3 skills per weapon"], ["Silakan putar ponsel ke mode", "Please rotate your phone to"], ["Morvath masih menunggumu...", "Morvath is still waiting for you..."], [" Berhati-hatilah, pahlawan!", " Be careful, hero!"], ["Ser Aldric menghampirimu...", "Ser Aldric is approaching you..."], ["1-5 : ganti senjata instan", "1-5 : switch weapon instantly"], ["Jiwamu kembali ke lobby...", "Your soul returns to the lobby..."], ["Otot tidak datang sendiri.", "Muscles don't come on their own."], ["tahan ±1 detik, lalu lepas", "hold ~1 second, then release"], ["Lanjutkan dialog di bawah.", "Continue the dialogue below."], ["Pedang ini terasa ringan.", "This sword feels light."], ["ULTIMATE SIAP! Tekan [Q]", "ULTIMATE READY! Press [Q]"], ["HP, Potion & Skill pulih", "HP, Potions & Skills restored"], ["Api ini hangat sekali...", "This fire is so warm..."], ["Disiplin adalah senjata.", "Discipline is a weapon."], ["tombol ⚡ + arah joystick", "button ⚡ + joystick direction"], ["ESC : jeda / menu utama", "ESC : pause / main menu"], ["Tunggu, aku belum siap!", "Wait, I'm not ready!"], ["Tarik napas... tahan...", "Breathe in... hold..."], ["Hmm, rumusnya begini...", "Hmm, the formula goes like this..."], ["Sampai jumpa, pahlawan.", "Farewell, hero."], ["Kau makin cepat, Bram.", "You're getting faster, Bram."], ["Boleh pulang sekarang?", "Can I go home now?"], ["Bram, angkat pedangmu!", "Bram, raise your sword!"], ["Ulangi duel · HP penuh", "Retry the duel · Full HP"], ["CHECKPOINT · RUANG BOS", "CHECKPOINT · BOSS CHAMBER"], ["Mouse : arah serangan", "Mouse : attack direction"], ["Angin hari ini nakal.", "The wind is naughty today."], ["Jangan malas, rekrut!", "Don't slack off, recruit!"], ["Menuju Camp Pelatihan", "Heading to the Training Camp"], [" (Lihat tombol STAT)", " (See the STAT button)"], ["Napas, bidik, lepas!", "Breathe, aim, release!"], ["Tusukan yang bersih.", "A clean thrust."], [" di kanan atas layar", " buttons at the top right of the screen"], ["Ser Aldric berbicara", "Ser Aldric speaks"], ["Landscape (Mendatar)", "Landscape mode"], ["Checkpoint ruang bos", "Boss chamber checkpoint"], [", Pedagang Keliling", ", Traveling Merchant"], ["Masih kurang berat!", "Still not heavy enough!"], ["Tebas dari pinggul!", "Slash from the hips!"], ["+ arah gerak (WASD)", "+ movement direction (WASD)"], ["ketuk tombol dialog", "tap the dialogue button"], ["Tidak, terima kasih", "No, thanks"], ["Alokasi Poin Status", "Allocate Stat Points"], ["Potion penuh (5/5)", "Potions full (5/5)"], ["Lobby — Zona Aman.", "Lobby — Safe Zone."], [", Rekrut Kelelahan", ", Exhausted Recruit"], [", Pengangkat Beban", ", Weightlifter"], ["Rhea! Kuda-kudamu!", "Rhea! Your stance!"], ["Meleset sedikit...", "Just missed..."], ["Tutorial dilewati.", "Tutorial skipped."], ["Ya, ajari aku lagi", "Yes, teach me again"], ["LOBBY — ZONA AMAN", "LOBBY — SAFE ZONE"], [", Pendekar Pedang", ", Swordsman"], [", Instruktur Camp", ", Camp Instructor"], ["Rak Senjata Brokk", "Brokk's Weapon Rack"], ["50 PANAH  10 LARI", "50 ARROWS  10 LAPS"], ["Aduh, tanganku...", "Ouch, my hands..."], ["Ayo, sekali lagi!", "Come on, once more!"], ["Seribu tebasan...", "A thousand slashes..."], [" di kanan bawah: ", " at the bottom right: "], ["MULAI PETUALANGAN", "BEGIN THE ADVENTURE"], ["M : suara ON/OFF", "M : sound ON/OFF"], [", Pelatih Tempur", ", Combat Trainer"], [", Murid Penyihir", ", Apprentice Mage"], ["LATIHAN HARI INI", "TODAY'S TRAINING"], ["Satu panah lagi.", "One more arrow."], ["Ikuti Ser Aldric", "Follow Ser Aldric"], ["Tunggu sebentar.", "Wait a moment."], ["Serangan Charged", "Charged Attack"], ["Kembali ke Lobby", "Return to Lobby"], ["Spasi konfirmasi", "Space to confirm"], ["RUANG PELATIHAN", "TRAINING HALL"], ["F : layar penuh", "F : fullscreen"], ["[G] Rak Senjata", "[G] Weapon Rack"], [", Penjaga Arsip", ", Keeper of the Archive"], [", Prajurit Muda", ", Young Soldier"], ["Tahan klik kiri", "Hold left click"], ["Latihan selesai", "Training complete"], ["PUTAR PERANGKAT", "ROTATE DEVICE"], ["Poin atribut: ", "Attribute points: "], ["Fase 3 — AMUK!", "Phase 3 — RAGE!"], ["LAPANGAN PANAH", "ARCHERY RANGE"], ["Tepat sasaran!", "Right on target!"], ["Hampir stabil!", "Almost stable!"], ["Serangan Dasar", "Basic Attack"], ["untuk bermain.", "to play."], ["ALOKASI STATUS", "ALLOCATE STATS"], ["Poin Tersedia:", "Available Points:"], [", Pandai Besi", ", Blacksmith"], [", Ksatria Tua", ", Old Knight"], ["RING SPARRING", "SPARRING RING"], ["Pip! Berdiri!", "Pip! On your feet!"], ["joystick kiri", "left joystick"], ["Ganti Senjata", "Switch Weapon"], ["Skill Senjata", "Weapon Skills"], ["tombol serang", "attack button"], ["Lawan Kembali", "Fight Again"], ["ULT SIAP [Q]", "ULT READY [Q]"], ["GARIS TEMBAK", "FIRING LINE"], ["Belum kalah!", "Not beaten yet!"], ["S-siap, Pak!", "Y-yes, sir!"], ["Ketuk tombol", "Tap the"], ["Lewati intro", "Skip intro"], ["PELATIHAN ▶", "TRAINING ▶"], [", Penyembuh", ", Healer"], ["100 TEBASAN", "100 SLASHES"], ["Jaga jarak!", "Keep your distance!"], ["tombol STAT", "the STAT button"], ["Layar Penuh", "Fullscreen"], ["Jeda / Menu", "Pause / Menu"], ["Gelombang ", "Wave "], ["[G] lanjut", "[G] next"], ["[G] Bicara", "[G] Talk"], [", Penombak", ", Spearman"], ["Ketua Orin", "Elder Orin"], ["API UNGGUN", "CAMPFIRE"], ["lalu lepas", "then release"], ["BICARA [G]", "TALK [G]"], ["[G] tutup", "[G] close"], ["KAU GUGUR", "YOU HAVE FALLEN"], [", Pemanah", ", Archer"], ["Klik kiri", "Left click"], [" selesai.", " complete."], [", Rekrut", ", Recruit"], ["Latihan ", "Training "], ["LANJUT ▶", "NEXT ▶"], ["Musuh: ", "Enemies: "], ["Gerak: ", "Move: "], ["LEWATI", "SKIP"], ["pilih", "select"]
      ], PM = {};
      PHL.forEach(function (p) { PM[p[0]] = p[1]; });
      var RX = new RegExp(PHL.map(function (p) { return p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|'), 'g');
      var cache = new Map();

      function core(s) {
        if (EX.hasOwnProperty(s))
          return EX[s];
        return s.replace(RX, function (m) { return PM[m]; });
      }
      window.TL = function (s) {
        if (LANG !== 'en' || typeof s !== 'string' || s.length < 2)
          return s;
        var c = cache.get(s);
        if (c !== undefined)
          return c;
        var r = core(s);
        if (cache.size > 3000)
          cache.clear();
        cache.set(s, r);
        return r;
      };
      window.getLang = function () { return LANG; };
      /* kanvas: semua fillText diterjemahkan otomatis */
      var ft = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (s, x, y, m) {
        if (LANG === 'en' && typeof s === 'string')
          s = window.TL(s);
        return m === undefined ? ft.call(this, s, x, y) : ft.call(this, s, x, y, m);
      };
      var oa = window.alert;
      window.alert = function (m) { return oa.call(window, window.TL(m)); };
      /* DOM: teks statis & dinamis (panel tutorial, tombol mobile, dll.) */
      var rec = new WeakMap(), attrO = new WeakMap();

      function tnode(n) {
        var cur = n.nodeValue, r = rec.get(n);
        if (r && cur === r.t) { /* masih hasil terjemahan kita */ } else if (r) {
          r.o = cur;
        } else {
          if (LANG !== 'en')
            return;
          r = { o: cur, t: cur };
          rec.set(n, r);
        }
        var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(r.o), t = r.o;
        if (LANG === 'en' && m[2]) {
          var k = m[2].replace(/\s+/g, ' ');
          t = m[1] + window.TL(k) + m[3];
        }
        if (t !== cur)
          n.nodeValue = t;
        r.t = t;
      }

      function walk(root) {
        if (root.nodeType === 3) {
          tnode(root);
          return;
        }
        if (root.nodeType !== 1 && root.nodeType !== 9)
          return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
        while ((n = w.nextNode())) {
          var pn = n.parentNode && n.parentNode.nodeName;
          if (pn !== 'SCRIPT' && pn !== 'STYLE')
            list.push(n);
        }
        list.forEach(tnode);
        var els = root.querySelectorAll ? root.querySelectorAll('[title]') : [];
        for (var i = 0; i < els.length; i++) {
          var e = els[i], o = attrO.get(e);
          if (o === undefined) {
            o = e.getAttribute('title');
            attrO.set(e, o);
          }
          e.setAttribute('title', LANG === 'en' ? window.TL(o) : o);
        }
      }
      var mo = new MutationObserver(function (list) {
        if (LANG !== 'en')
          return;
        list.forEach(function (mu) {
          if (mu.type === 'characterData')
            tnode(mu.target);
          else
            mu.addedNodes.forEach(function (n) { walk(n); });
        });
      });

      function paintBtns() {
        var bs = document.querySelectorAll('.lang-btn');
        for (var i = 0; i < bs.length; i++)
          bs[i].classList.toggle('on', bs[i].getAttribute('data-lang') === LANG);
        var o = document.getElementById('langOut');
        if (o)
          o.textContent = LANG === 'en' ? 'ENGLISH' : 'INDONESIA';
      }
      window.setLang = function (l) {
        LANG = l === 'en' ? 'en' : 'id';
        cache.clear();
        try {
          localStorage.setItem(KEY, LANG);
        } catch (e) { }
        document.documentElement.lang = LANG;
        walk(document.body);
        paintBtns();
      };
      document.addEventListener('DOMContentLoaded', function () {
        mo.observe(document.body, { childList: true, characterData: true, subtree: true });
        document.addEventListener('click', function (e) {
          var b = e.target.closest && e.target.closest('.lang-btn'); if (b)
            window.setLang(b.getAttribute('data-lang'));
        });
        document.documentElement.lang = LANG;
        if (LANG === 'en')
          walk(document.body);
        paintBtns();
      });
    })();

/* ===== SAVE SYSTEM EXTENSIONS & HELPERS ===== */
window.GameSave = {
  saveSettings: function() {
    try {
      localStorage.setItem('ea_music_vol', document.getElementById('musicVol') ? document.getElementById('musicVol').value : '70');
      localStorage.setItem('ea_sfx_vol', document.getElementById('sfxVol') ? document.getElementById('sfxVol').value : '80');
      localStorage.setItem('ea_brightness', document.getElementById('brightness') ? document.getElementById('brightness').value : '100');
      localStorage.setItem('ea_lang', window.getLang ? window.getLang() : 'id');
    } catch(e) {}
  },
  loadSettings: function() {
    try {
      var mv = localStorage.getItem('ea_music_vol');
      if (mv && document.getElementById('musicVol')) document.getElementById('musicVol').value = mv;
      var sv = localStorage.getItem('ea_sfx_vol');
      if (sv && document.getElementById('sfxVol')) document.getElementById('sfxVol').value = sv;
      var br = localStorage.getItem('ea_brightness');
      if (br && document.getElementById('brightness')) document.getElementById('brightness').value = br;
    } catch(e) {}
  }
};
