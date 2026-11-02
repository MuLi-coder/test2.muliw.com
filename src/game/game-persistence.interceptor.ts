import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { GameService } from './game.service';

@Injectable()
export class GamePersistenceInterceptor implements NestInterceptor {
  constructor(private readonly games: GameService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const id = context.switchToHttp().getRequest().params?.id as string | undefined;
    if (!id) return next.handle();
    return from(this.games.ensure(id)).pipe(
      mergeMap(() => next.handle()),
      mergeMap(result => from(this.games.save(id)).pipe(map(() => result))),
    );
  }
}
