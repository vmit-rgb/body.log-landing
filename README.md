# body.log-landing

Лендинг щоденника руху й самопочуття [body.log](https://github.com/vmit-rgb/body.log): що це, що варто знати, як встановити, питання, фідбек.

**Статус:** бета 0.9, тексти — чернетка.

## Що тут важливо знати
- Сторінка статична: увесь текст лежить у `index.html` і читається без JavaScript.
- Без аналітики й сторонніх запитів. Шрифт лежить у репозиторії, QR-код малюється під час збірки, а не сервісом.
- Хостинг (GitHub Pages) бачить IP-адреси відвідувачів, як будь-який сайт. Про це сказано в розділі «питання».
- Адреса застосунку прописана в одному місці: `.env` (`VITE_APP_URL`). З неї беруться і посилання, і QR-код.

## Поки що неактивне
- Перемикач мови `eng`: англійська версія буде пізніше.
- «залишити фідбек»: гугл-форма буде пізніше.
- LinkedIn і Behance: посилання будуть пізніше.
- «скопіювати промпт» показує повідомлення, що промпт ще пишемо.

## Для розробки
Потрібен Node.js (версія в `.nvmrc`).

```sh
npm ci          # встановити залежності точно за lock-файлом
npm run dev     # локальний сервер
npm run check   # типи, тести, збірка
```

Залежності зафіксовано точними версіями, яким щонайменше два тижні. Скрипти встановлення пакетів вимкнено (`.npmrc`). GitHub Actions закріплено на хешах комітів. Кожна зміна йде через pull request і перевірку `check`; `deploy` публікує сайт на GitHub Pages.

## Права
© 2026 (Олеся + Нитка / AI).

Код поширюється за ліцензією GNU Affero General Public License 3.0 (лише ця версія): [LICENSE](LICENSE). Його можна читати, змінювати й поширювати, але будь-яка змінена версія, зокрема та, що працює як сайт чи сервіс, має бути відкрита під тією ж ліцензією, з усім своїм кодом.

The code is licensed under the GNU Affero General Public License v3.0 only (AGPL-3.0-only): see [LICENSE](LICENSE). Any modified version, including one run as a website or service, must publish its full source under the same license.

Шрифт Noto Sans Mono поширюється за ліцензією SIL Open Font License 1.1: [public/fonts/OFL-NotoSansMono.txt](public/fonts/OFL-NotoSansMono.txt).

(Олеся + Нитка / AI)
