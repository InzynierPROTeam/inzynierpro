# Technologie klientów i zakres języków

Publiczna witryna apps/web korzysta z Astro. Platforma do nauki i admin korzystają z TanStack Start, a późniejsza aplikacja mobilna z React Native i Expo. Konkretne wersje i sposób uruchomienia dobieramy przy tworzeniu aplikacji; zależności mobile muszą być zgodne z wybranym SDK Expo. Logika biznesowa pozostaje we wspólnym backendzie zgodnie z ADR-0021.

Witryna, platforma, mobile i treści edukacyjne są polskojęzyczne. i18n przewidujemy wyłącznie w adminie i dodajemy przy jego rozwoju, bez rozszerzania zakresu na wielojęzyczną naukę.

Identyfikatory kodu, komentarze, testy, techniczne próbki oraz dokumentacja poza ADR są po angielsku. Interfejs platformy, komunikaty użytkownika, SEO i publiczne adresy stron są po polsku. Techniczne nazwy grup routingu i pola kontraktów HTTP zachowują swoje identyfikatory. Prozę ADR zapisujemy po polsku.

Pierwsze wydanie webu i późniejszego mobile wymaga połączenia z backendem do nauki, bez pełnego trybu offline i synchronizacji odpowiedzi. Obsługujemy utratę połączenia, stan zapisu i ponowienie operacji. Potwierdzona odpowiedź pochodzi z backendu; niezapisany wynik nie jest przedstawiany jako zapisany.

Publiczna witryna zawiera bazę wiedzy o zdobywaniu uprawnień obok bloga, FAQ i kontakt dostępny bez logowania. Kontakt dotyczący aplikacji jest odrębny od zgłoszeń błędów konkretnych pytań.

We wszystkich aplikacjach przewidujemy motyw jasny, ciemny i systemowy. Zachowujemy kierunek sensownego samouczka pierwszego użycia; jego przebieg dopracowujemy przy projektowaniu interfejsu.
