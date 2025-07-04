class SaldoFavor {
  private endpoint: string = "https://api.example.com/saldoafavor";

  private constructor() {}

  public async getSaldoAFavor(): Promise<number> {
    // Simulate an API call to fetch the balance
    return new Promise((resolve) => {
      setTimeout(() => resolve(1000), 1000);
    });
  }
}
