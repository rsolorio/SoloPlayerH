import { ReadableDateTimePipe } from './readable-date-time.pipe';

describe('ReadableDateTimePipe', () => {
  it('create an instance', () => {
    const pipe = new ReadableDateTimePipe();
    expect(pipe).toBeTruthy();
  });
});
