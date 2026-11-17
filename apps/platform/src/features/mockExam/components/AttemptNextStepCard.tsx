import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Link } from '@tanstack/react-router'
import { ListChecks, Repeat } from 'lucide-react'

export const AttemptNextStepCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>
        <h2>Co dalej?</h2>
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      <Item
        variant="outline"
        size="lg"
        className="border-primary/50"
      >
        <ItemMedia>
          <IconWrapper variant="primary-soft">
            <Repeat />
          </IconWrapper>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Kolejny egzamin</ItemTitle>
          <ItemDescription>Nowe losowanie pytań, kolejna próba przed egzaminem.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            nativeButton={false}
            render={<Link to="/egzamin-probny/start" />}
          >
            Zacznij kolejny egzamin
          </Button>
        </ItemActions>
      </Item>
      <Item
        variant="outline"
        size="lg"
      >
        <ItemMedia>
          <IconWrapper>
            <ListChecks />
          </IconWrapper>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Twoje egzaminy</ItemTitle>
          <ItemDescription>Przejrzyj historię i wyniki dotychczasowych podejść.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/egzamin-probny" />}
          >
            Przejdź do panelu egzaminów
          </Button>
        </ItemActions>
      </Item>
    </CardContent>
  </Card>
)
