import styles from "./privacy.module.css";

export const metadata = {
  title: "Privacy Policy · Konstantinopol SpineNet",
};

export default function PrivacyPage() {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Privacy Policy / Политика конфиденциальности</h1>

      <section className={styles.card} lang="ru">
        <h2>Политика конфиденциальности</h2>

        <h3>О проекте</h3>
        <p>
          Konstantinopol SpineNet — учебный исследовательский проект: демонстрация
          автоматической сегментации и нумерации позвонков на рентгенограммах. Сервис не
          является медицинским изделием и не предназначен для постановки диагноза.
        </p>

        <h3>Какие данные мы не собираем</h3>
        <p>
          На сайте нет регистрации. Мы не запрашиваем имя, почту или телефон и не
          используем рекламные и аналитические cookie.
        </p>

        <h3>Загружаемые изображения</h3>
        <p>
          Файл, который вы загружаете, передаётся на сервер, обрабатывается только во время
          запроса и не сохраняется. Мы не передаём его третьим лицам. DICOM-файлы, в которых
          указаны имя пациента, дата рождения, адрес или телефон, отклоняются: проверка
          выполняется в вашем браузере до отправки и повторно на сервере. Пожалуйста, не
          загружайте снимки с персональными данными.
        </p>

        <h3>Где находится сервер</h3>
        <p>
          Сервер обработки размещён у провайдера Render за пределами Российской Федерации,
          статические страницы сайта — на GitHub Pages. Поэтому перед загрузкой вы
          подтверждаете, что изображение не содержит персональных данных.
        </p>

        <h3>Технические журналы</h3>
        <p>
          Хостинг-провайдеры (GitHub, Render) могут фиксировать технические данные
          запросов, включая IP-адрес. Мы используем журнал сервера только для отладки.
        </p>

        <h3>Демонстрационные изображения</h3>
        <p>
          Изображения в галерее и каталоге обезличены или взяты из открытых источников.
        </p>

        <h3>Контакты</h3>
        <p>
          Вопросы и запросы на удаление данных можно направить через раздел Issues
          репозитория https://github.com/kostya785/k-spinenet.
        </p>

        <p className={styles.date}>Редакция от 1 ноября 2026 года.</p>
      </section>

      <section className={styles.card} lang="en">
        <h2>Privacy Policy</h2>

        <h3>About the project</h3>
        <p>
          Konstantinopol SpineNet is an educational research project: a demonstration of
          automatic segmentation and numbering of vertebrae on X-ray images. It is not a
          medical device and is not intended for diagnosis.
        </p>

        <h3>Data we do not collect</h3>
        <p>
          There is no registration. We do not ask for a name, email or phone number and do
          not use advertising or analytics cookies.
        </p>

        <h3>Uploaded images</h3>
        <p>
          A file you upload is sent to the server, processed only while the request is
          handled and not saved. We do not pass it to third parties. DICOM files that contain
          a patient name, birth date, address or phone number are rejected: the check runs in
          your browser before upload and again on the server. Please do not upload images
          that contain personal data.
        </p>

        <h3>Where the server is located</h3>
        <p>
          The processing server is hosted by Render outside the Russian Federation, and the
          static pages are hosted on GitHub Pages. That is why you confirm before uploading
          that the image contains no personal data.
        </p>

        <h3>Technical logs</h3>
        <p>
          Hosting providers (GitHub, Render) may record technical request data, including
          the IP address. We use the server log only for debugging.
        </p>

        <h3>Demo images</h3>
        <p>Images in the gallery and the catalog are anonymized or taken from open sources.</p>

        <h3>Contact</h3>
        <p>
          Questions and removal requests can be sent through the Issues section of the
          repository https://github.com/kostya785/k-spinenet.
        </p>

        <p className={styles.date}>Last updated: 1 November 2026.</p>
      </section>
    </div>
  );
}
