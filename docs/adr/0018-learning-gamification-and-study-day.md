# Wspólna gamifikacja nauki i granica dnia

Pierwsze wydanie obejmuje Learning XP, dzienny cel, streak, podstawowe odznaki i ranking miesięczny. Punkty za wkład społecznościowy i reputację rozwijamy później jako odrębne mechanizmy. Wysokie XP nie nadaje uprawnień do zatwierdzania materiałów; nagrody i sponsorzy pozostają późniejszym etapem.

Każdy użytkownik uczestniczy w rankingu; udział nie jest dobrowolną opcją. Profil jest domyślnie publiczny, ale pokazuje wyłącznie nazwę, XP i odznaki oraz opcjonalny avatar wybrany przez użytkownika. Nie udostępniamy publicznie postępów ścieżek, skuteczności, celów, wyników egzaminów ani szczegółowej historii odpowiedzi. Streak pozostaje elementem własnego panelu użytkownika. E-mail i prywatne notatki również pozostają prywatne. Doprecyzowanie to zastępuje wcześniejsze ogólne określenie „wszystko publiczne”.

Profil można ustawić jako prywatny. Nadal ma wiersz rankingowy z pseudonimem i wynikiem, ale inni użytkownicy nie mogą otworzyć jego strony profilu. Prywatność nie zmienia miejsca ani naliczania punktów.

Pierwsze wydanie udostępnia ranking zalogowanym użytkownikom aplikacji. Publiczny ranking na witrynie może później powstać jako osobny widok o wybranym zakresie danych. Ranking miesięczny liczy XP zdobyte w danym miesiącu, a całkowite XP konta pozostają zachowane. Nowy miesiąc nie resetuje historii, streaka ani odznak; granice miesięcy wyznacza Europe/Warsaw.

Publicznie używamy pseudonimu, który użytkownik może zmienić. Początkowo nadajemy go automatycznie, bez wymagania dodatkowego formularza przed nauką. Imię, nazwisko i zdjęcie pobrane podczas logowania przez Google lub Apple nie są automatycznie publikowane jako wizytówka rankingowa. Publiczny pseudonim i avatar użytkownik może ustawić w profilu.

XP i streak są wspólne dla konta i agregują naukę pisemną, ustną i aktywność z różnych ścieżek. Historia, rundy i SRS pozostają rozdzielone. Reguły gamifikacji ograniczają ponowne naliczanie punktów za to samo pytanie i wielokrotne wykonywanie tej samej czynności; szczegółowe zasady naliczania pozostają do ustalenia.

Sensowna zatwierdzona próba może dawać podstawowe XP również przy błędnej odpowiedzi. Samodzielna poprawność i należne powtórki mogą dawać dodatkowe punkty; odpowiedź z pomocą nie otrzymuje bonusu za samodzielny sukces. Samo otwarcie aplikacji, pytania lub wyjaśnienia nie daje XP. Konkretne wartości i limity są wspólną konfiguracją backendu.

Dzienny cel wyrażamy w liczbie pytań, osobno dla pisemnego i ustnego w danej ścieżce, podobnie jak w V1. Służy planowaniu przejścia materiału do wybranego terminu. Nie wyrażamy go w XP; punkty i streak pozostają wspólne dla konta.

Do celu liczymy odpowiedzi w zwykłej nauce przesuwające przechodzenie materiału, niezależnie od poprawności; w ustnym jest to zatwierdzona samoocena. Powtórki, ulubione, egzaminy i mini-quizy mogą zasilać XP oraz streak, ale nie zaliczają kolejnych pytań zwykłej nauki w celu przejścia materiału.

Backend proponuje liczbę pytań dziennie na podstawie materiału pozostałego do przejścia i wybranej daty ukończenia przygotowań, a użytkownik może zmienić plan. Obliczenia są wspólne dla klientów. Przyjęty cel na dziś jest stały podczas nauki; jego zmiana wymaga świadomej aktualizacji planu. System może proponować zmianę na kolejne dni po zmianie tempa lub terminu. Zachowujemy historię wcześniejszych celów i realizacji.

Streak podtrzymuje niewielkie stałe minimum kwalifikowanej aktywności niezależne od wybranego dziennego celu. Ambitniejszy cel nie zwiększa trudności utrzymania streaka. Dokładny próg pozostaje do ustalenia z początkową punktacją; samo zalogowanie nie spełnia warunku.

Początkowo dzienny cel, streak i okresy rankingowe liczymy według Europe/Warsaw, na podstawie czasu backendu. Web i mobile pokazują ten sam dzień nauki. SRS korzysta z rzeczywistego czasu między próbami, a północ nie resetuje stanu powtórek. Indywidualna strefa użytkownika może być późniejszym rozszerzeniem.

Użytkownik może świadomie wygenerować i udostępnić grafikę ze streakiem lub wynikiem egzaminu próbnego. Nie publikuje to automatycznie tych danych na profilu; prywatność panelu i historii pozostaje zgodna z wcześniejszymi zasadami.

## Reset i rozróżnienie planu

Rozróżniamy pozostały materiał, przyjęty stały plan dnia i pozostałą pracę dzisiaj. Ukończona pula nie oznacza opanowania; należne powtórki są osobne. Nie dodajemy ręcznego aktualnego trybu: potrzeby pisemnego i ustnego wyliczamy osobno w granicach dostępu.

Reset prywatnej historii jednej ścieżki nie usuwa zdobytych lifetime/miesięcznych XP ani ich wkładu do rankingów. Pozostaje minimalny rejestr nagród, aby reset nie odtwarzał bonusów pierwszego osiągnięcia lub limitów. Nie zachowujemy w nim usuwanych odpowiedzi ani postępu. Przypisanie, cel, inne ścieżki oraz wspólne notatki i ulubione pozostają. Szczegóły naliczania, streaka, analityki po resecie i kolejnych rund planowania wymagają osobnych specyfikacji przed implementacją.
