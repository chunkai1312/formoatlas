import { HttpContextToken, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { GlobalProgressService } from '../services/global-progress.service';

export const SKIP_GLOBAL_PROGRESS = new HttpContextToken<boolean>(() => false);

export const globalProgressInterceptor: HttpInterceptorFn = (request, next) => {
  if (shouldSkipGlobalProgress(request)) {
    return next(request);
  }

  const progress = inject(GlobalProgressService);
  const token = progress.start('http');

  return next(request).pipe(
    finalize(() => progress.done(token)),
  );
};

export function shouldSkipGlobalProgress(request: HttpRequest<unknown>): boolean {
  if (request.context.get(SKIP_GLOBAL_PROGRESS)) return true;
  if (!isApiRequest(request.url)) return true;

  const acceptsEventStream = request.headers.get('Accept')?.includes('text/event-stream') ?? false;
  const isStreamEndpoint = request.url.includes('/stream');

  return acceptsEventStream || isStreamEndpoint;
}

function isApiRequest(url: string): boolean {
  return url.startsWith('/api/') || url.startsWith('api/') || /^https?:\/\/[^/]+\/api\//.test(url);
}
