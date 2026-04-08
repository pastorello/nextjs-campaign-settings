import pageMetaFields from "@/app/lib/config/pageMetaFields";
import isArrayEmpty from "@/app/lib/utils/validators/isArrayEmpty";
import SortableHeader from "../buttons/SortableHeader";
import DeleteButton from "../buttons/DeleteButton";
import PageType from "@/app/lib/definitions/types/PageType";
import ModalButton from "../buttons/ModalButton";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import SpellMetaField from "@/app/lib/definitions/enums/spells/SpellMetaField";

export default async function SpellList(props: {
  searchParams?: SearchParams;
}) {
  const fetchedItems = await fetchFilteredSpells(props.searchParams ?? {});

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          {isArrayEmpty(fetchedItems) && <p>{"Nessun Incantesimo trovato"}</p>}
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  <SortableHeader
                    label={"Nome"}
                    fieldKey="nome"
                    isFiltrable={false}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  <SortableHeader
                    label={"Livello"}
                    fieldKey={SpellMetaField.livello}
                  />
                </th>
                <th scope="col" className="px-3 py-5 font-medium max-w-0">
                  <SortableHeader
                    label={"Classi"}
                    fieldKey={SpellMetaField.classi}
                  />
                </th>
                <th
                  scope="col"
                  className="relative py-5 pl-6 pr-3 justify-center flex"
                >
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {fetchedItems?.map((item) => (
                <tr
                  key={item.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      <p>
                        <strong>
                          {pageMetaFields[SpellMetaField.nome].getDatum(
                            item.nome,
                          )}
                        </strong>
                      </p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {pageMetaFields[SpellMetaField.livello].getDatum(
                      item.livello,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {pageMetaFields[SpellMetaField.classi].getDatum(
                      item.classi,
                    )}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <ModalButton
                        buttonLabel={"Modifica"}
                        modalTitle={"Modifica Incantesimo"}
                        modalContent={"spellform"}
                        componentProps={{ formData: item }}
                      />
                      <DeleteButton
                        pageName={item.nome}
                        pageId={item.id}
                        pageType={PageType.Spell}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
