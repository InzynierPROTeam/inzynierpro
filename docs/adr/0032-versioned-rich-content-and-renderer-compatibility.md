# Wersjonowany format opracowań i zgodność rendererów

Opracowania i wyjaśnienia zachowują format Tiptap/ProseMirror JSON, z jawnym wersjonowanym schematem obsługiwanych elementów zamiast dowolnego obiektu JSON. Backend, edytor i renderery korzystają ze wspólnego kontraktu treści. Pozwala to sprawdzić zgodność importu i rozwijać zestaw elementów bez niejawnych różnic między klientami.

Grafiki materiałów przechowujemy w R2, a treść zawiera odwołania do zasobów zamiast osadzonych danych base64. Kolejne rewizje mogą korzystać z tej samej grafiki; backend obsługuje uzyskanie adresu i dostępu zgodnie z metadanymi zasobu.

Nieobsługiwany element nie może znikać po cichu z opracowania. Renderery mają testy wspólnej specyfikacji, a dodawanie elementów uwzględnia obsługiwane wersje klientów. Brak obsługi wymaga jawnego fallbacku lub komunikatu. Konkretny mechanizm wybierzemy przy projektowaniu renderera mobile; nie zakładamy automatycznie pełnej zgodności istniejących rendererów V1.
