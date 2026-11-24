export const translations = {
    en: {
      /* ---------- header ---------- */
      "nav.main": "Main",
      "nav.try": "Try Model",
      "nav.catalog": "Catalog",
      "nav.about": "About",
      "nav.faq": "FAQ",
      "nav.privacy": "Privacy",
  
      /* ---------- hero ---------- */
      "hero.cta": "Try Model →",
      "hero.disclaimer":
        "This tool does not provide medical diagnosis. Consult a physician.",
  
      /* ---------- try model ---------- */
      "try.title": "Try the Model",
      "try.upload": "Click to upload X-ray or DICOM",
      "try.hint":
        "Do not upload images that contain personal data. Files with patient identifiers are rejected.",
      "try.notice":
        "This file contains patient identifiers (name or birth date). It was not uploaded. Please anonymize it or choose an image from the gallery.",
      "try.gallery": "or choose from our gallery",
      "try.previewTitle": "Click to enlarge and inspect details",
      "try.zoomBadge": "🔍 Click to zoom",
      "try.consent.before":
        "I confirm that this image contains no personal data and I have read the ",
      "try.consent.link": "Privacy Policy",
      "try.detect": "Detect",
      "try.detecting": "Detecting...",
      "try.result": "Result",
      "try.class": "Class:",
      "try.confidence": "Confidence:",
      "try.none": "No objects detected",
      "try.error": "Error while contacting the model",
      "try.zoomIn": "➕ Zoom In",
      "try.zoomOut": "➖ Zoom Out",
      "try.close": "❌ Close",
  
      /* ---------- about ---------- */
      "about.xrays": "X-rays",
      "about.pipeline.title": "Training Pipeline",
      "about.pipeline.text":
        "Our model was trained on a curated dataset of about 2500 X-rays with advanced augmentation and YOLO11s backbone.",
      "about.accuracy.title": "Model Accuracy",
      "about.accuracy.text":
        "The chart shows the mask mAP50 of the final model on the annotated dataset (preliminary).",
      "about.dataset.title": "Dataset",
      "about.dataset.text":
        "The dataset includes frontal and lateral X-rays of the spine with expert-verified annotations.",
      "about.dynamics.title": "Training Dynamics",
      "about.dynamics.text":
        "This chart shows box mAP50-95 and training box loss over 60 epochs: 20 epochs of initial training and 40 epochs of fine-tuning, which starts at epoch 21.",
      "about.metrics.title": "Model Performance Metrics",
      "about.metrics.text":
        "These metrics summarize the final performance of the model on the annotated dataset (preliminary) after 60 epochs (20 initial + 40 fine-tuning). Metrics are given for segmentation masks. Precision and Recall describe detection quality, while mAP metrics reflect overall accuracy across IoU thresholds.",
      "about.chart.lossName": "Train Box Loss",
      "about.chart.lossDesc":
        "shows how accurately the model predicts bounding box coordinates. Lower values indicate better localization performance.",
      "about.chart.mapName": "Box mAP50-95",
      "about.chart.mapDesc":
        "the averaged detection accuracy across IoU thresholds from 0.50 to 0.95. This is the primary metric for evaluating object detection quality: higher values indicate better overall performance.",
  
      /* ---------- faq ---------- */
      "faq.title": "FAQ",
      "faq.q1": "How does the model work?",
      "faq.a1":
        "The model analyzes an X-ray image, identifies vertebral segments and determines their coordinates with high accuracy.",
      "faq.q2": "What pictures are supported?",
      "faq.a2":
        "Standard frontal and sagittal images are supported, including all sections of the spine.",
      "faq.q3": "Where are my images processed and stored?",
      "faq.a3":
        "Uploaded images are processed only while your request is handled and are not saved. The demo server is hosted outside the Russian Federation (Render), so please do not upload images that contain personal data: DICOM files with a patient name, birth date, address or phone number are rejected. Images in the gallery and the catalog are anonymized or taken from open sources. Details are in the Privacy Policy at /privacy/.",
      "faq.q4": "What percentage of accuracy?",
      "faq.a4":
        "Preliminary results on the annotated dataset: 96.8% mask mAP50 and 58.6% mask mAP50-95; precision is 93.3% and recall is 93.8%. An evaluation on an independent test set is planned.",
  
      /* ---------- catalog ---------- */
      "catalog.title": "Catalog",
      "catalog.region": "Region",
      "catalog.region.cervical": "Cervical",
      "catalog.region.thoracic": "Thoracic",
      "catalog.region.lumbar": "Lumbar",
      "catalog.region.sacrum": "Sacrum",
      "catalog.region.pelvis": "Pelvis",
      "catalog.region.femoral": "Femoral heads",
      "catalog.mode.contains": "Contains",
      "catalog.mode.only": "Only",
      "catalog.structures": "Specific structures",
      "catalog.minConf": "Minimum model confidence",
      "catalog.minCount": "Minimum structures found",
      "catalog.reset": "Reset filters",
      "catalog.hint": "Confidence is the model's own score, not image quality.",
      "catalog.sort.newest": "Newest first",
      "catalog.sort.confidence": "Highest confidence",
      "catalog.sort.count": "Most structures",
      "catalog.images.one": "image",
      "catalog.images.few": "images",
      "catalog.images.many": "images",
      "catalog.structuresCount.one": "structure",
      "catalog.structuresCount.few": "structures",
      "catalog.structuresCount.many": "structures",
      "catalog.serverError": "Cannot reach the server. Is the backend running?",
      "catalog.empty": "No images match these filters",
      "catalog.alt": "Annotated X-ray",
      "catalog.delete": "Delete",
      "catalog.deleteYes": "Yes, delete",
      "catalog.cancel": "Cancel",
      "catalog.close": "Close",
    },
  
    ru: {
      /* ---------- header ---------- */
      "nav.main": "Главная",
      "nav.try": "Демо",
      "nav.catalog": "Каталог",
      "nav.about": "О проекте",
      "nav.faq": "FAQ",
      "nav.privacy": "Приватность",
  
      /* ---------- hero ---------- */
      "hero.cta": "Попробовать модель →",
      "hero.disclaimer":
        "Этот инструмент не ставит медицинский диагноз. Обратитесь к врачу.",
  
      /* ---------- try model ---------- */
      "try.title": "Попробуйте модель",
      "try.upload": "Нажмите, чтобы загрузить рентген или DICOM",
      "try.hint":
        "Не загружайте снимки с персональными данными. Файлы с идентификаторами пациента отклоняются.",
      "try.notice":
        "Этот файл содержит идентификаторы пациента (имя или дату рождения). Он не был загружен. Обезличьте его или выберите снимок из галереи.",
      "try.gallery": "или выберите снимок из нашей галереи",
      "try.previewTitle": "Нажмите, чтобы развернуть и рассмотреть детали",
      "try.zoomBadge": "🔍 Клик для зума",
      "try.consent.before":
        "Подтверждаю, что на этом снимке нет персональных данных, и ознакомлен(а) с ",
      "try.consent.link": "Политикой конфиденциальности",
      "try.detect": "Распознать",
      "try.detecting": "Распознавание...",
      "try.result": "Результат",
      "try.class": "Класс:",
      "try.confidence": "Уверенность:",
      "try.none": "Объекты не обнаружены",
      "try.error": "Ошибка при запросе к модели",
      "try.zoomIn": "➕ Приблизить",
      "try.zoomOut": "➖ Отдалить",
      "try.close": "❌ Закрыть",
  
      /* ---------- about ---------- */
      "about.xrays": "рентгеновских снимков",
      "about.pipeline.title": "Пайплайн обучения",
      "about.pipeline.text":
        "Наша модель обучена на отобранном датасете примерно из 2500 рентгеновских снимков с продвинутой аугментацией и бэкбоном YOLO11s.",
      "about.accuracy.title": "Точность модели",
      "about.accuracy.text":
        "На графике показан mask mAP50 финальной модели на размеченном датасете (предварительный результат).",
      "about.dataset.title": "Датасет",
      "about.dataset.text":
        "Датасет включает прямые и боковые рентгеновские снимки позвоночника с аннотациями, проверенными экспертами.",
      "about.dynamics.title": "Динамика обучения",
      "about.dynamics.text":
        "На графике показаны box mAP50-95 и box loss на обучении за 60 эпох: 20 эпох начального обучения и 40 эпох дообучения (fine-tuning), которое начинается с 21-й эпохи.",
      "about.metrics.title": "Метрики качества модели",
      "about.metrics.text":
        "Метрики отражают итоговое качество модели на размеченном датасете (предварительный результат) после 60 эпох (20 начальных + 40 дообучения). Метрики приведены для масок сегментации. Precision и Recall описывают качество детекции, а метрики mAP отражают общую точность при разных порогах IoU.",
      "about.chart.lossName": "Train Box Loss",
      "about.chart.lossDesc":
        "показывает, насколько точно модель предсказывает координаты ограничивающих рамок. Чем ниже значение, тем лучше локализация.",
      "about.chart.mapName": "Box mAP50-95",
      "about.chart.mapDesc":
        "средняя точность детекции при порогах IoU от 0.50 до 0.95. Это основная метрика качества детекции объектов: чем выше значение, тем лучше результат.",
  
      /* ---------- faq ---------- */
      "faq.title": "FAQ",
      "faq.q1": "Как работает модель?",
      "faq.a1":
        "Модель анализирует рентгеновский снимок, находит сегменты позвонков и с высокой точностью определяет их координаты.",
      "faq.q2": "Какие изображения поддерживаются?",
      "faq.a2":
        "Поддерживаются стандартные снимки во фронтальной и сагиттальной проекциях, включая все отделы позвоночника.",
      "faq.q3": "Где обрабатываются и хранятся мои снимки?",
      "faq.a3":
        "Загруженные снимки обрабатываются только на время выполнения вашего запроса и не сохраняются. Демо-сервер размещён за пределами Российской Федерации (Render), поэтому, пожалуйста, не загружайте снимки с персональными данными: DICOM-файлы с именем пациента, датой рождения, адресом или номером телефона отклоняются. Изображения в галерее и каталоге обезличены или взяты из открытых источников. Подробности — в Политике конфиденциальности: /privacy/.",
      "faq.q4": "Какова точность модели?",
      "faq.a4":
        "Предварительные результаты на размеченном датасете: 96,8% mask mAP50 и 58,6% mask mAP50-95; precision — 93,3%, recall — 93,8%. Оценка на независимой тестовой выборке запланирована.",
  
      /* ---------- catalog ---------- */
      "catalog.title": "Каталог",
      "catalog.region": "Регион",
      "catalog.region.cervical": "Шейный",
      "catalog.region.thoracic": "Грудной",
      "catalog.region.lumbar": "Поясничный",
      "catalog.region.sacrum": "Крестец",
      "catalog.region.pelvis": "Таз",
      "catalog.region.femoral": "Головки бедренных костей",
      "catalog.mode.contains": "Содержит",
      "catalog.mode.only": "Только",
      "catalog.structures": "Конкретные структуры",
      "catalog.minConf": "Минимальная уверенность модели",
      "catalog.minCount": "Минимум найденных структур",
      "catalog.reset": "Сбросить фильтры",
      "catalog.hint": "Уверенность — это собственная оценка модели, а не качество снимка.",
      "catalog.sort.newest": "Сначала новые",
      "catalog.sort.confidence": "Наибольшая уверенность",
      "catalog.sort.count": "Больше всего структур",
      "catalog.images.one": "изображение",
      "catalog.images.few": "изображения",
      "catalog.images.many": "изображений",
      "catalog.structuresCount.one": "структура",
      "catalog.structuresCount.few": "структуры",
      "catalog.structuresCount.many": "структур",
      "catalog.serverError": "Не удаётся связаться с сервером. Запущен ли бэкенд?",
      "catalog.empty": "Нет изображений, подходящих под фильтры",
      "catalog.alt": "Размеченный рентгеновский снимок",
      "catalog.delete": "Удалить",
      "catalog.deleteYes": "Да, удалить",
      "catalog.cancel": "Отмена",
      "catalog.close": "Закрыть",
    },
  };