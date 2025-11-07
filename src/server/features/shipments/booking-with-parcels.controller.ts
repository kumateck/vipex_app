import {
  createBookingWithParcelsSvc,
  type CreateBookingWithParcelsBody,
} from './booking-with-parcels.service';

export const createBookingWithParcelsCtrl = (body: CreateBookingWithParcelsBody) =>
  createBookingWithParcelsSvc(body);
