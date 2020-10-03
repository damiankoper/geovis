# 1. Wstęp

Żyjemy w świecie w którym...

## Istota rzeczy

Dlaczego atrakcyjne przedstawienie danych jest ważne?

- Wizualizacja zjawisk - przykłady z życia.
- Zobrazowanie skali zjawisk.
- Atrakcyjne nie zawsze znaczy dokładne (pixel perfect), gdy celem jest zainteresowanie zjawiskiem.

Jak dobra architektura aplikacji może pomóc w tworzeniu zróżnicowanych wizualizacji?

- Podział odpowiedzialności domen aplikacji.
- Konfigurowalne abstrakcje pozwalają oprzeć różne wizualizacje na tych samych, ogólnych założeniach.
- Dobrze udokumentowane środowisko pracy - interaktywna dokumentacja przyspiesza pracę.

## Zawartość pracy

Co jest którym rozdziale opisane i ogólny cel projektu

# 2. Wymagania

Tutaj lista z Latexa zamieniona na ponumerowaną tabelę.

## Wizualizacja

### Twórca

### Odbiorca

## Aplikacja

# 3. Silnik

Wszystko jest wyświetlane w scenie. Obiekty dostarczają wizualizacje.

## WebGL i GLSL

Czym są, jak przebiega proces rasteryzacji. MVP.

### ThreeJS

Czym jest oraz kształt dostarczanego interfejsu i komponentów.

## Praca kamery

Ogólna koncepcja. Podział na 2 orbity.
Możliwość ruchu w każdej z nich, a także przybliżania i oddalania.

### Orbita globalna

- OrbitGroup - podział na elementy ruchome i nieruchome
- Opis + rysunek z wektorami.
- Obroty i kalkulacja kwaternionu obrotu
- Ograniczenia ruchu - kwaternion korekcji
- Tryby pracy - FREE & COMPASS
- Inne ustawienia

### Orbita lokalna

- Opis + rysunek z wektorami.
- Obroty i kalkulacja kwaternionu obrotu.
- Ograniczenia ruchu - kwaternion korekcji
- Orientowanie w kierunku północnym - wyliczanie kwaternionu obrotu
- Inne ustawienia

### Obrót orbity globalnej

### Animacje - płynność pracy

- Sferyczna interpolacja pomiędzy kwaternionami. Liniowa między wektorami. Funkcje wygładzające.

## Implementacja

- JavaScript/TypeScript

### GeoVisCore

- Schemat GeoVisCore razem z zależnościami.
- Opis poszczególnych domen i zawieranych klas. Odniesienia do podrozdziału "Praca kamery".
- Punktem wejścia ze strony interfejsu użytkownika jest element Canvas.

### Interfejs i ustawienia

- TrackballCamera. Opis akcji i zdarzeń. Implementuje go klasa TrackballController.
- Możliwość utworzenia innych typów kontrolerów implementujących ten sam interface.

## Wizualizacja

- Dokładny diagram klas. Listing z przykładową pustą klasą wizualizacji
- Metadane
- Opis inicjalizacji, aktualizowania, niszczenia, ustawiania metadanych.
- Opis dziedziczenia po wielu wizualizacjach. Modyfikacja metadanych przy dziedzieczeniu.

### Vue.js i Webpack

- Krótko czym jest Vue.
- Idea eksportowania komponentów silnika jako osobnej biblioteki.
- Uzasadnienie potrzeby osadzenia elementu Canvas w komponencie.
- Czym jest Webpack i idea budowania aplikacji z modułów. Alternatywy Webpacka.
- Schemat komponentów w połączeniu z osadzonym GeoVisCore.
- Opis propów, zachowania i przepływu danych.
- Throttle na obsługę zdarzeń dla kompasu i współrzędnych. Mimo wszystko update Vue jest za wolny na pełne 60fps.

## Ograniczenia, możliwości optymalizacji i rozwoju

- Ograniczenia wynikające z użycia Webpacka razem z Vue do budowania całej biblioteki.
- eksport typów TypeScriptu nie jest domyślnie wspierany. Wymaga modyfikacji.
- użycie przykładowych wizualizacji wymaga ręcznego przekopiowania dodatkowych assetów i workerów

# 4. Wizualizacje

Wszędzie schematy

## Gwiazdy

- Podstawa do prawie wszystkich wizualizacji
- Materiał z nadpisanym zachowaniem dla z-buffera
- Możliwości optymalizacji

## Atmosfera

- Specjalne shadery - zasady generowania
- opis + rysunek sfer 2d
- Możliwości optymalizacji

## Kula ziemska

- Tekstury dużej rozdzielczości
- Kilka warstw - mapy różnego rodzaju, specular, normal.
- Modyfikacja shadera dla materiału z modelem oświetlenia Phonga. Różne tekstury dla oświetlonej i nieoświetlonej strony planety.
- Kalkulacja parametrów słońca - kąt godzinowy, deklinacja. Punkt byka - niedokładność.
- Możliwości optymalizacji

## Międzynarodowa stacja kosmiczna

- Obiekt SatelliteObject.
- Kalkulacja parametrów orbity na podstawie TLE
- Wyświetlanie orbity i pozycji satelity, kalkulacja elipsy
- Etykiety
- Możliwości optymalizacji

## Aktywne satelity

- Wyświetlanie chmury punktów
- Pozycja w danym czasie
- Możliwości optymalizacji

## Kafelki i radar pogodowy

- Standard numerowania kafelków. + rysunek
- Mapowanie współrzędnych na kafelek
- Projekcja: Odwzorowanie walcowe równokątne, odwzorowanie Merkatora
- Kafelki nie zawierają skrajnych szerokości
- Tekstura ziemi ma projekcję: Odwzorowanie walcowe równoodległościowe
- Generowanie geometrii
- Aktualizowanie wyświetlanych kafelków - aktualizowanie drzewiastej struktury
- Dynamiczne rysowanie tekstury w workerze
  - względy wydajności, dekodowanie tekstury w osobnym wątku
  - cache blobów
  - transferable ImageBitmap
  - OffscreenCanvas
- Priorytetyzacja generowania kafelków - najpierw te najbliżej środka obserwatora
- Wiele warstw kafelków
- Błąd zakresu liczby zmiennoprzecinkowej dla "rozciągniętych modeli", generowanych daleko od środka. Sposoby rozwiązania. Mnożenie vs dodawanie przy transformacji.
- Możliwości optymalizacji

# 5. Aplikacja

- Struktura komponentów aplikacji
- Umieszczenie wizualizacji w tablicy
- Filtrowanie wizualizacji
- Karty wizualizacji z metadanymi

# 6. Testy i dokumentacja

- Narzędzia: Jest + Cypress, storybook
- Natura testów jednostkowych i integracyjnych
- Przykład i efekt testu jednostkowego i integracyjnego
- Dynamicznie generowana dokumentacja + przykład

# 8. Podsumowanie

- Fajnie było
- Podsumowanie wszystkich rozdziałów
- Przyszłość ogólna projektu
