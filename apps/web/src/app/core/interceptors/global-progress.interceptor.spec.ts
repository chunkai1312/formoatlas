import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GlobalProgressService } from '../services/global-progress.service';
import {
  SKIP_GLOBAL_PROGRESS,
  globalProgressInterceptor,
  shouldSkipGlobalProgress,
} from './global-progress.interceptor';

describe('globalProgressInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let progress: GlobalProgressService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([globalProgressInterceptor])),
        provideHttpClientTesting(),
        GlobalProgressService,
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    progress = TestBed.inject(GlobalProgressService);
  });

  afterEach(() => {
    httpTesting.verify();
    progress.resetForTesting();
  });

  it('tracks API requests and completes them on success', async () => {
    const promise = firstValueFrom(http.get('/api/marketdata/barometer'));
    const req = httpTesting.expectOne('/api/marketdata/barometer');

    expect(progress.activeCount()).toBe(1);
    req.flush({ ok: true });
    await promise;

    expect(progress.activeCount()).toBe(0);
  });

  it('completes tracked requests on error', async () => {
    const promise = firstValueFrom(http.get('/api/marketdata/barometer')).catch(error => error);
    const req = httpTesting.expectOne('/api/marketdata/barometer');

    expect(progress.activeCount()).toBe(1);
    req.flush('fail', { status: 500, statusText: 'Server Error' });
    await promise;

    expect(progress.activeCount()).toBe(0);
  });

  it('completes tracked requests when unsubscribed', () => {
    const subscription = http.get('/api/marketdata/barometer').subscribe();
    httpTesting.expectOne('/api/marketdata/barometer');

    expect(progress.activeCount()).toBe(1);
    subscription.unsubscribe();

    expect(progress.activeCount()).toBe(0);
  });

  it('skips requests marked with context', async () => {
    const promise = firstValueFrom(http.get('/api/marketdata/barometer', {
      context: new HttpContext().set(SKIP_GLOBAL_PROGRESS, true),
    }));
    const req = httpTesting.expectOne('/api/marketdata/barometer');

    expect(progress.activeCount()).toBe(0);
    req.flush({ ok: true });
    await promise;
  });

  it('skips event stream and stream endpoint requests', () => {
    const streamRequest = new RequestLike('/api/agent/conversations/c1/messages/stream', new HttpHeaders());
    const acceptRequest = new RequestLike('/api/agent/market-research', new HttpHeaders({ Accept: 'text/event-stream' }));

    expect(shouldSkipGlobalProgress(streamRequest as never)).toBe(true);
    expect(shouldSkipGlobalProgress(acceptRequest as never)).toBe(true);
  });

  it('skips non-API requests', async () => {
    const promise = firstValueFrom(http.get('/assets/config.json'));
    const req = httpTesting.expectOne('/assets/config.json');

    expect(progress.activeCount()).toBe(0);
    req.flush({});
    await promise;
  });
});

class RequestLike {
  readonly context = new HttpContext();

  constructor(
    readonly url: string,
    readonly headers: HttpHeaders,
  ) {}
}
