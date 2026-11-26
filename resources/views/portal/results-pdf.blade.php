{{-- Results of the portal as PDF (dompdf): one page per study --}}
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Resultados · {{ $patient['name'] }}</title>
<style>
    @page { margin: 32px 36px; }
    * { box-sizing: border-box; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2d22; }
    .study { page-break-after: always; }
    .study:last-child { page-break-after: auto; }
    .head { border-bottom: 2px solid #2E8B3E; padding-bottom: 10px; margin-bottom: 12px; width: 100%; }
    .head td { vertical-align: top; }
    .clinic { font-size: 15px; font-weight: bold; }
    .muted { color: #52605a; }
    .right { text-align: right; }
    .data { width: 100%; margin-bottom: 12px; font-size: 11px; }
    .data td { padding: 2px 8px 2px 0; }
    table.results { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    table.results th { text-align: left; padding: 6px 8px; background: #F6FAF1; border-bottom: 1px solid #DCEBC9; font-size: 9.5px; text-transform: uppercase; letter-spacing: .04em; color: #56693f; }
    table.results td { padding: 6px 8px; border-bottom: 1px solid #eef0ec; }
    .num { text-align: right; }
    .flag { color: #B45309; font-weight: bold; }
    h3 { margin: 10px 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #56693f; }
    .impression { padding: 8px 10px; border-left: 3px solid #2E8B3E; background: #F6FAF1; }
    .images img { width: 230px; margin: 0 8px 8px 0; }
    .foot { border-top: 1px solid #eef0ec; margin-top: 16px; padding-top: 8px; width: 100%; font-size: 10px; }
</style>
</head>
<body>
@foreach ($studies as $study)
<div class="study">
    <table class="head">
        <tr>
            <td>
                <div class="clinic">{{ $clinic['name'] }}</div>
                <div class="muted">{{ $study['department'] }}@if ($clinic['address']) · {{ $clinic['address'] }}@endif @if ($clinic['phone']) · Tel. {{ $clinic['phone'] }}@endif</div>
            </td>
            <td class="right">
                <div><b>{{ $study['name'] }}</b></div>
                <div class="muted">Atención del {{ $patient['service_date'] }}@if ($patient['invoice']) · Factura {{ $patient['invoice'] }}@endif</div>
            </td>
        </tr>
    </table>

    <table class="data">
        <tr>
            <td><span class="muted">Paciente:</span> <b>{{ $patient['name'] }}</b></td>
            <td><span class="muted">Edad / sexo:</span> {{ $patient['age_sex'] ?: '—' }}</td>
        </tr>
        <tr>
            <td><span class="muted">{{ $study['taken_label'] }}:</span> {{ $study['taken'] }}</td>
            <td><span class="muted">Médico:</span> {{ $study['doctor'] ?? '—' }}</td>
        </tr>
    </table>

    @if ($study['kind'] === 'lab')
        <table class="results">
            <thead><tr><th>Prueba</th><th class="num">Resultado</th><th>Unidad</th><th>Valores de referencia</th></tr></thead>
            <tbody>
            @foreach ($study['rows'] as $row)
                <tr>
                    <td>{{ $row['test'] }}</td>
                    <td class="num {{ $row['flag'] ? 'flag' : '' }}">{{ $row['value'] }} {{ $row['flag'] }}</td>
                    <td class="muted">{{ $row['unit'] }}</td>
                    <td class="muted">{{ $row['reference'] }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
        <div class="muted">Los valores marcados con <span class="flag">A</span> (alto) o <span class="flag">B</span> (bajo) están fuera del rango de referencia.</div>
    @else
        @if (count($study['embedded']) > 0)
            <div class="images">
            @foreach ($study['embedded'] as $image)
                <img src="{{ $image['src'] }}" alt="{{ $image['name'] }}">
            @endforeach
            </div>
        @endif
        <h3>Hallazgos</h3>
        <div>{{ $study['findings'] }}</div>
        <h3>Impresión diagnóstica</h3>
        <div class="impression"><b>{{ $study['conclusion'] }}</b></div>
    @endif

    <table class="foot">
        <tr>
            <td class="muted">Validado por <b>{{ $study['validated_by'] ?? '—' }}</b> · {{ $study['validated_at'] }}</td>
            <td class="right muted">Verificación: {{ $study['verification'] }}</td>
        </tr>
    </table>
    <div class="muted" style="margin-top:6px">Estos resultados deben ser interpretados por su médico.</div>
</div>
@endforeach
</body>
</html>
