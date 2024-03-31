# mobx-form-control-kit

## Описание

Данный пакет содержит набор объектов для реализации форм с асинхронной валидацией основанный на [Mobx](https://mobx.js.org/) 6 версии. Совместим с [React](https://reactjs.org) и [Vue](https://vuejs.org/).

## Базовый пример

Создается одно поле формы. Указывается, что значение обязательно для заполнения.

*Данный пример хоть и является базовым, не рекомендуется как основной сценарий работы, хоть и является допустимым.*

```typescript
const App = observer(() => {
  const [firstName] = React.useState(
    () =>
      new FormControl<string>("VA", {
        validators: [requiredValidator()],
      })
  );

  return (
    <div>
      <p>{firstName.value}</p>
      <input
        value={firstName.value}
        onChange={(event) => (firstName.value = event.target.value)}
        onFocus={() => (firstName.focused = true)}
        onBlur={() => (firstName.focused = false)}
      />
      {firstName.touched &&
        firstName.errors.map((err) => (
          <p key={err.key} style={{ color: "red" }}>
            {err.message}
          </p>
        ))}
      <button
        onClick={async () => {
          await firstName.wait();
          if (firstName.invalid) {
            firstName.touched = true;
            return;
          }
          // Отправка данных
        }}
      >
        Отправить
      </button>
    </div>
  );
});
```

## Типы контролов

Контролы разделены на два вида:

* **FormControl** - используется для хранения одного значения. Рекомендуется использовать примитивные типы, такие как: string, number, date, boolean и т.д. И избегать объектов. Хранение объектов допустимо, но нарушает концепцию формы.
* **FormGroup** - используется для объединения FormControl и FormGroup в группы.

Оба типа являются наследниками абстрактного класса **AbstractControl**. **AbstractControl** реализует интерфейс **IAbstractControl**, что позволяет гибко настроить структуру данных и передачу объектов данных типов.

Чтобы узнать к какому типу принадлежит объект IAbstractControl, можно воспользоваться полем **type** содержащие значение из enum.

```typescript
enum ControlTypes {
  Control,
  Group,
}
```

Рекомендуемая организация кода выглядит следующим образом:

```typescript
interface IFormPerson extends ControlsCollection {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  middleName: FormControl<string>;
  age: FormControl<number | undefined>;
}

interface IFormPassport extends ControlsCollection {
  number: FormControl<number | undefined>;
  serias: FormControl<number | undefined>;
  issuedИy: FormControl<string>;
}

interface IFormDriverLicense extends ControlsCollection {
  number: FormControl<number | undefined>;
  serias: FormControl<number | undefined>;
  toDate: FormControl<Date | undefined>;
}

enum DocumentType {
  Passport,
  DriverLicense,
}

interface IFormDocument extends ControlsCollection {
  type: FormControl<DocumentType | undefined>;
  passport: FormGroup<IFormPassport>;
  driverLicense: FormGroup<IFormDriverLicense>;
}

interface IFormChild extends ControlsCollection {
  name: FormControl<string>;
  age: FormControl<number | undefined>;
}

interface IForm extends ControlsCollection {
  person: FormGroup<IFormPerson>;
  document: FormGroup<IFormDocument>;
  children: FormGroup<IFormChild>[];
}

class Questionnaire {
  public form: FormGroup<IForm>;

  constructor() {
    this.form = new FormGroup<IForm>({
      person: new FormGroup<IFormPerson>({
        firstName: new FormControl<string>(""),
        lastName: new FormControl<string>(""),
        middleName: new FormControl<string>(""),
        age: new FormControl<number | undefined>(undefined),
      }),
      document: new FormGroup<IFormDocument>({
        type: new FormControl<DocumentType | undefined>(undefined),
        passport: new FormGroup<IFormPassport>({
          number: new FormControl<number | undefined>(undefined),
          serias: new FormControl<number | undefined>(undefined),
          issuedИy: new FormControl<string>(""),
        }),
        driverLicense: new FormGroup<IFormDriverLicense>({
          number: new FormControl<number | undefined>(undefined),
          serias: new FormControl<number | undefined>(undefined),
          toDate: new FormControl<Date | undefined>(undefined),
        }),
      }),
      children: [],
    });
  }
}
```

В вышеописанном примере создается форма для заполнения карточки человека с указанием его ФИО, возраста, типа документа. А также можно указать детей. В данном форме отсутствуют валидации, но она уже готова для заполнения и использования в коде.

## Валидации

--- В процессе описания ---

## Поля и методы

Общие поля и методы для групп и отдельного поля.

| Поля / Методы | Описани | Description |
|---------------|---------|-------------|
| **valid** | Форма (поле) валидное | Form (field) is valid |
| **invalid** | Форма (поле) невалидное | Form (field) is invalid |
| **dirty** | Значение изменялось | Value changed |
| **pristine** | Значение не изменялось (обратное значение dirty) | Value has not changed (reverse dirty) |
| **focused** | Форма (поле) сейчас в фокусе | Form (field) is now in focus |
| **element** | Ссылка на визуальный элемент | Ref html element  |
| **touched** | Форма (поле) было в фокусе | Form (field) was in focus |
| **untouched** | Форма (поле) не было в фокусе (обратное значение touched) | Form (field) was out of focus (reverse touched) |
| **validators** | Методы валидации | Validator-functions |
| **events** | Все события валидации (результат выполениения методов валидации) | All valudation events (result of validator-functions) |
| **event(key: string)** | Получить ошибку по ключу | Get error by key |
| **tempErrors** | Дополнительтные (серверные) ошибки | Additional (server) errors |
| **hasErrors** | Группа (поле) содержит ошибки | Form (field) contains errors |
| **errors** | Список ошибок | Errors list |
| **hasWarnings** | Присутствуют сообщения с типом "Внимание" | The field contains warnings messages |
| **warnings** | Список сообщений с типом "Внимание" | Warnings messages list |
| **hasInformations** | Присутствуют сообщения с типом "Информационные сообщения" | The field contains informations messages |
| **informations** | Сообщения с типом "Информационные сообщения" | Informations messages list |
| **hasSuccesses** | Присутствуют сообщения с типом "успешная валидация" | The field contains successes |
| **successes** | Сообщения с типом "успешная валидация" | Successes messages list |
| **maxEventLevel** | Максимальный уровень сообщения | Max message level |
| **processing** | Форма в процессе валидации | Form in validation progressing |
| **getActivate** | Функция включение валидаций по условию (по умолчанию включено всегда) | Function enable validation by condition (always enabled by default) |
| **active** | Проверка ошибок включена (результат работы метода getActivate) | Error checking enabled (result of getActivate) |
| **disabled** | Проверка ошибок отключена (обратное значение active) | Error checking is disabled (reverse active) |
| **additionalData** | Поле для передачи дополнительной информации (в логике не участвует)  | Field for transferring additional information |
| **type** | Тип контрола (группа/поле) | Control type (group/control) |
| **dispose()** |  Вызвать при удалении контрола | Dispose (call in unmount control) |
| **wait()** | Ожидание окончания проверки | Waiting for end of validation |
