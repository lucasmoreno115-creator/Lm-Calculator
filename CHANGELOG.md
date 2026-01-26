# Changelog

## [2.0.0] - 2026-01-22

### Added
- Strict reason contract: reasons são sempre { code, message }
- Contract tests (shape) para garantir formato do resultado
- Observabilidade por reason.code (debug): codes + histograma

### Changed
- Removido fallback por texto na UI (strict-only)
- Engine passa a emitir reason-copy v1.3 como { code, message } (sem strings)

### Fixed
- Eliminação de paths legados que emitiam reasons como string
