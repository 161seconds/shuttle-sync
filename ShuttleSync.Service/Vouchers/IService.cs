using ShuttleSync.Repository.Entities;

namespace ShuttleSync.Service.Vouchers;
public interface IVoucherService
{
    Task<object> AllAsync(CancellationToken ct = default);
    Task<List<Voucher>> MineAsync(string userId, CancellationToken ct = default);
    Task<Voucher> ApproveAsync(string id, string status, CancellationToken ct = default);
    Task<Voucher> CreateAsync(string userId, VoucherRequest input, bool global, CancellationToken ct = default);
    Task<Voucher> UpdateAsync(string userId, string role, string id, VoucherRequest input, CancellationToken ct = default);
    Task DeleteAsync(string userId, string role, string id, CancellationToken ct = default);
    Task<VoucherValidationResponse> ValidateAsync(ValidateVoucherRequest input, CancellationToken ct = default);
}
