import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { PassengerCreatedVia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type RowError = { row: number; message: string };

@Injectable()
export class PassengersService {
  constructor(private readonly prisma: PrismaService) {}

  async addManual(tripId: string, dto: { fullName: string; studentDocument?: string }) {
    await this.ensureTrip(tripId);
    return this.prisma.passenger.create({
      data: {
        tripId,
        fullName: dto.fullName.trim(),
        studentDocument: dto.studentDocument?.trim() || null,
        createdVia: PassengerCreatedVia.MANUAL_FORM,
      },
    });
  }

  private async ensureTrip(tripId: string) {
    const t = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!t) {
      throw new NotFoundException('Trip not found');
    }
    return t;
  }

  parseRows(buffer: Buffer, mime: string): Record<string, string>[] {
    const lower = mime.toLowerCase();
    if (
      lower.includes('csv') ||
      lower.includes('text/plain') ||
      lower.includes('application/vnd.ms-excel')
    ) {
      const text = buffer.toString('utf8');
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as Record<string, string>[];
      return records;
    }
    if (
      lower.includes('spreadsheet') ||
      lower.includes('sheet') ||
      lower.includes('excel')
    ) {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
        defval: '',
      });
      return rows;
    }
    throw new BadRequestException('Unsupported file type');
  }

  validateRows(rows: Record<string, string>[]): {
    valid: { fullName: string; studentDocument?: string }[];
    errors: RowError[];
  } {
    const errors: RowError[] = [];
    const valid: { fullName: string; studentDocument?: string }[] = [];
    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const fullName =
        row.fullName?.trim() ||
        row['Full Name']?.trim() ||
        row.nome?.trim() ||
        '';
      const studentDocument =
        row.studentDocument?.trim() ||
        row['Student Document']?.trim() ||
        row.documento?.trim() ||
        undefined;
      if (!fullName) {
        errors.push({ row: rowNum, message: 'fullName is required' });
        return;
      }
      valid.push({ fullName, studentDocument });
    });
    return { valid, errors };
  }

  async importPassengers(
    tripId: string,
    buffer: Buffer,
    mime: string,
    mode: 'preview' | 'commit',
  ) {
    await this.ensureTrip(tripId);
    let rows: Record<string, string>[];
    try {
      rows = this.parseRows(buffer, mime);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Parse error';
      return {
        ok: false,
        summary: 'Import blocked: file could not be parsed',
        rowErrors: [{ row: 0, message: msg }],
      };
    }
    const { valid, errors } = this.validateRows(rows);
    if (errors.length > 0) {
      return {
        ok: false,
        summary:
          'Import blocked: validation failed for one or more rows (no rows were saved)',
        rowErrors: errors,
      };
    }
    if (mode === 'preview') {
      return {
        ok: true,
        summary: `Preview OK: ${valid.length} row(s) ready to import`,
        rowErrors: [] as RowError[],
        previewCount: valid.length,
      };
    }
    await this.prisma.$transaction(async (tx) => {
      for (const v of valid) {
        await tx.passenger.create({
          data: {
            tripId,
            fullName: v.fullName,
            studentDocument: v.studentDocument ?? null,
            createdVia: PassengerCreatedVia.IMPORT_FILE,
          },
        });
      }
    });
    return {
      ok: true,
      summary: `Imported ${valid.length} passenger(s)`,
      rowErrors: [] as RowError[],
    };
  }
}
